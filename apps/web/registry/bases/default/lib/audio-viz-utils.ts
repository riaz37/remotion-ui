import {
  useWindowedAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

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

/** Remotion recommends a generous window so sliding reloads do not drop audio mid-playback. */
export const DEFAULT_AUDIO_WINDOW_SECONDS = 30;

export function useSpectrumBars({
  src,
  numberOfSamples = 64,
  windowInSeconds = DEFAULT_AUDIO_WINDOW_SECONDS,
  frame: frameOverride,
}: UseSpectrumBarsOptions) {
  const frame = frameOverride ?? useCurrentFrame();
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

/** Logarithmic scaling for more balanced bar heights */
export function scaleFrequenciesForDisplay(
  frequencies: number[],
  minDb = -100,
  maxDb = -30,
) {
  return frequencies.map((value) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const db = 20 * Math.log10(value);
    if (!Number.isFinite(db)) return 0;
    return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
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
