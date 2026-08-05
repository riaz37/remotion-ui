import {
  useWindowedAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

/** Remotion recommends a generous window so sliding reloads do not drop audio mid-playback. */
export const DEFAULT_AUDIO_WINDOW_SECONDS = 30;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type SpectrumBandOptions = {
  /** How many display bands the FFT bins collapse into. */
  bandCount?: number;
  /**
   * Bins below this index are folded into the first band. Bin 0 carries DC plus
   * rumble, which otherwise dwarfs everything musical.
   */
  minBin?: number;
  /**
   * Music loses roughly 6 dB per octave, so an untilted spectrum renders as a
   * ramp that collapses into the noise floor after the first few bars. Tilting
   * it back up spreads the bands across the full height.
   */
  tiltDbPerOctave?: number;
  /** Band level mapped to 0. */
  floorDb?: number;
  /** Band level mapped to 1. */
  ceilingDb?: number;
  /** Blends each band toward its neighbours to remove single-bin comb artifacts. */
  neighbourBlend?: number;
};

export const SPECTRUM_DEFAULTS = {
  bandCount: 48,
  minBin: 1,
  tiltDbPerOctave: 6,
  // Window measured against tilted band levels: a full-scale mix lands around
  // -6 dB on transients and drops to roughly -20 dB between hits.
  floorDb: -20,
  ceilingDb: -5,
  neighbourBlend: 0.25,
} as const satisfies Required<SpectrumBandOptions>;

/** Geometric band edges — equal width per octave rather than per hertz. */
function logBandEdges(binCount: number, bandCount: number, minBin: number) {
  const first = Math.max(1, minBin);
  const ratio = (binCount / first) ** (1 / bandCount);

  return Array.from(
    { length: bandCount + 1 },
    (_, index) => first * ratio ** index,
  );
}

/**
 * Turns raw `visualizeAudio()` magnitudes into 0-1 display bands.
 *
 * Linear downsampling puts every octave above ~1 kHz into the last couple of
 * bars and leaves the rest of the display static, so bins are grouped
 * logarithmically, tilted to undo the natural spectral rolloff, and mapped
 * through a decibel window.
 */
export function toSpectrumBands(
  frequencies: number[],
  options: SpectrumBandOptions = {},
): number[] {
  const bandCount = options.bandCount ?? SPECTRUM_DEFAULTS.bandCount;
  const minBin = options.minBin ?? SPECTRUM_DEFAULTS.minBin;
  const tiltDbPerOctave =
    options.tiltDbPerOctave ?? SPECTRUM_DEFAULTS.tiltDbPerOctave;
  const floorDb = options.floorDb ?? SPECTRUM_DEFAULTS.floorDb;
  const ceilingDb = options.ceilingDb ?? SPECTRUM_DEFAULTS.ceilingDb;
  const neighbourBlend =
    options.neighbourBlend ?? SPECTRUM_DEFAULTS.neighbourBlend;

  if (frequencies.length === 0 || bandCount <= 0) {
    return [];
  }

  const edges = logBandEdges(frequencies.length, bandCount, minBin);
  const referenceBin = edges[0];
  const span = Math.max(1, ceilingDb - floorDb);

  const raw = Array.from({ length: bandCount }, (_, index) => {
    const start = Math.floor(edges[index]);
    const end = Math.max(start + 1, Math.floor(edges[index + 1]));

    let sum = 0;
    let count = 0;
    for (let bin = start; bin < end && bin < frequencies.length; bin += 1) {
      const value = frequencies[bin];
      if (Number.isFinite(value) && value > 0) {
        sum += value;
        count += 1;
      }
    }

    if (count === 0) {
      return 0;
    }

    const magnitude = sum / count;
    const centerBin = Math.sqrt(edges[index] * edges[index + 1]);
    const octaves = Math.log2(centerBin / referenceBin);
    const db = 20 * Math.log10(magnitude) + octaves * tiltDbPerOctave;

    return clamp01((db - floorDb) / span);
  });

  if (neighbourBlend <= 0) {
    return raw;
  }

  return raw.map((value, index) => {
    const previous = raw[index - 1] ?? value;
    const next = raw[index + 1] ?? value;
    return lerp(value, (previous + next) / 2, neighbourBlend);
  });
}

export type EnvelopeOptions = {
  /** 0-1 per frame. Higher snaps to transients faster. */
  attack?: number;
  /** 0-1 per frame. Lower leaves a longer tail after a hit. */
  release?: number;
};

export const ENVELOPE_DEFAULTS = {
  attack: 0.62,
  release: 0.26,
} as const satisfies Required<EnvelopeOptions>;

/**
 * Runs an attack/release follower over a window of past frames.
 *
 * Remotion renders every frame from scratch, so smoothing cannot be carried in
 * state — the history is replayed instead, which keeps the result identical
 * whether the frame is reached by playback, by seeking, or by a distributed
 * render.
 */
export function followEnvelope(
  history: number[][],
  options: EnvelopeOptions = {},
): number[] {
  // Spreading `options` directly would let an explicitly-undefined field
  // overwrite the default with undefined, which propagates as NaN.
  const attack = options.attack ?? ENVELOPE_DEFAULTS.attack;
  const release = options.release ?? ENVELOPE_DEFAULTS.release;

  if (history.length === 0) {
    return [];
  }

  let envelope = [...history[0]];

  for (let index = 1; index < history.length; index += 1) {
    const current = history[index];
    envelope = envelope.map((previous, band) => {
      const target = current[band] ?? 0;
      return lerp(previous, target, target > previous ? attack : release);
    });
  }

  return envelope;
}

/**
 * Peak level per band with a linear falloff — the cap that hangs above a bar
 * after a transient and slides back down.
 */
export function followPeaks(
  history: number[][],
  fallPerFrame = 0.022,
): number[] {
  if (history.length === 0) {
    return [];
  }

  let peaks = [...history[0]];

  for (let index = 1; index < history.length; index += 1) {
    const current = history[index];
    peaks = peaks.map((previous, band) =>
      Math.max(current[band] ?? 0, previous - fallPerFrame),
    );
  }

  return peaks;
}

/** Mean level across a slice of the band range. `to` is exclusive. */
export function bandEnergy(bands: number[], from = 0, to = bands.length) {
  const slice = bands.slice(from, to);
  if (slice.length === 0) {
    return 0;
  }
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

/**
 * Deterministic stand-in used while audio data loads, and in environments where
 * the source cannot be fetched. Two incommensurate rates keep it from reading
 * as a single looping sine.
 */
export function idleBands(bandCount: number, seconds: number): number[] {
  return Array.from({ length: bandCount }, (_, index) => {
    const position = index / Math.max(1, bandCount - 1);
    const rolloff = 0.86 - position * 0.42;
    const sway =
      Math.sin(seconds * Math.PI * 2 * 0.6 - position * 3.1) * 0.15 +
      Math.sin(seconds * Math.PI * 2 * 1.37 - position * 5.7) * 0.07;
    return clamp01(rolloff * 0.44 + sway);
  });
}

export type UseSpectrumBarsOptions = {
  src: string;
  numberOfSamples?: number;
  windowInSeconds?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>` to avoid discontinuities.
   */
  frame?: number;
};

export function useSpectrumBars({
  src,
  numberOfSamples = 64,
  windowInSeconds = DEFAULT_AUDIO_WINDOW_SECONDS,
  frame: frameOverride,
}: UseSpectrumBarsOptions) {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps } = useVideoConfig();

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds,
  });

  if (!audioData) {
    return { frequencies: null as number[] | null, audioData: null };
  }

  const frequencies = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples,
    optimizeFor: "speed",
    dataOffsetInSeconds,
  });

  return { frequencies, audioData };
}

export type UseAudioBandsOptions = UseSpectrumBarsOptions &
  SpectrumBandOptions &
  EnvelopeOptions & {
    /** How many past frames feed the follower. */
    historyFrames?: number;
    peakFallPerFrame?: number;
    /**
     * Scales the display so the loudest recent band reaches near full height.
     * Without it a quietly mastered track renders as a permanently short
     * display and a hot one sits clipped at the top.
     */
    autoGain?: boolean;
    /** Lookback used to find the reference level for `autoGain`. */
    gainWindowInSeconds?: number;
    /** Height the reference level is scaled to. */
    gainTarget?: number;
    /** Reference levels below this are treated as silence and left alone. */
    gainReferenceFloor?: number;
    /** Upper bound on the auto-gain multiplier. */
    maxGain?: number;
    /**
     * Gamma applied after auto-gain. A tilted spectrum of dense material is
     * close to flat, which reads as a solid slab; values above 1 push the
     * quieter bands down so the shape stays legible.
     */
    contrast?: number;
  };

export type AudioBands = {
  /** Smoothed 0-1 level per band, low frequency first. */
  bands: number[];
  /** Decaying peak level per band, for cap markers. */
  peaks: number[];
  /** True once real audio data is driving the bands. */
  isReady: boolean;
  /** Resolved frame, so callers stay in sync inside a `<Sequence>`. */
  frame: number;
  fps: number;
};

/**
 * One call for the whole chain: windowed audio data, FFT, logarithmic bands,
 * attack/release smoothing, and peak tracking — with an animated fallback so a
 * component never renders a dead flat line while audio loads.
 */
export function useAudioBands({
  src,
  numberOfSamples = 128,
  windowInSeconds = DEFAULT_AUDIO_WINDOW_SECONDS,
  frame: frameOverride,
  historyFrames = 6,
  peakFallPerFrame = 0.022,
  attack,
  release,
  autoGain = true,
  gainWindowInSeconds = 0.5,
  gainTarget = 1,
  gainReferenceFloor = 0.08,
  maxGain = 6,
  contrast = 1.7,
  ...bandOptions
}: UseAudioBandsOptions): AudioBands {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps } = useVideoConfig();
  const bandCount = bandOptions.bandCount ?? SPECTRUM_DEFAULTS.bandCount;

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds,
  });

  if (!audioData) {
    const idle = idleBands(bandCount, frame / fps);
    return { bands: idle, peaks: idle, isReady: false, frame, fps };
  }

  const bandsAtFrame = (targetFrame: number) =>
    toSpectrumBands(
      visualizeAudio({
        fps,
        frame: Math.max(0, targetFrame),
        audioData,
        numberOfSamples,
        optimizeFor: "speed",
        dataOffsetInSeconds,
      }),
      bandOptions,
    );

  const history = Array.from({ length: historyFrames }, (_, index) =>
    bandsAtFrame(frame - (historyFrames - 1 - index)),
  );

  const smoothed = followEnvelope(history, { attack, release });
  const peaks = followPeaks(history, peakFallPerFrame);

  /**
   * The loudest band this frame sets the scale, so the display always fills
   * regardless of how the source was mastered. Blending in a slower reference
   * keeps quiet passages visibly quieter instead of pumping every one of them
   * back up to full height.
   */
  const gain = (() => {
    if (!autoGain) return 1;

    const peakOf = (values: number[]) =>
      values.reduce((max, value) => Math.max(max, value), 0);

    const immediate = peakOf(smoothed);
    const lookback = Math.max(1, Math.round(gainWindowInSeconds * fps));
    const slow = Math.max(
      immediate,
      peakOf(bandsAtFrame(frame - lookback)),
    );
    const reference = lerp(immediate, slow, 0.45);

    if (reference <= gainReferenceFloor) return 1;
    return Math.min(maxGain, Math.max(1, gainTarget / reference));
  })();

  const shape = (values: number[]) =>
    values.map((value) => clamp01(value * gain) ** contrast);

  return {
    bands: shape(smoothed),
    peaks: shape(peaks),
    isReady: true,
    frame,
    fps,
  };
}

/** Logarithmic scaling for more balanced bar heights. */
export function scaleFrequenciesForDisplay(
  frequencies: number[],
  minDb = -60,
  maxDb = -12,
) {
  const span = Math.max(1, maxDb - minDb);

  return frequencies.map((value) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const db = 20 * Math.log10(value);
    if (!Number.isFinite(db)) return 0;
    return clamp01((db - minDb) / span);
  });
}

/** Downsample FFT bins into fewer display bars (peak per bucket). */
export function downsampleSpectrum(values: number[], barCount: number): number[] {
  if (barCount <= 0) return [];
  if (values.length <= barCount) return values.map((v) => (Number.isFinite(v) ? v : 0));

  const bucketSize = values.length / barCount;
  return Array.from({ length: barCount }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.floor((index + 1) * bucketSize);
    let peak = 0;
    for (let i = start; i < end; i++) {
      const value = values[i] ?? 0;
      if (Number.isFinite(value)) peak = Math.max(peak, value);
    }
    return peak;
  });
}
