import {
  createSmoothSvgPath,
  useWindowedAudioData,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { useId } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type WaveformLineProps = {
  src: string;
  /**
   * Drawing width. Defaults to the composition width — pass the width of the
   * slot when the waveform sits inside padding or a safe area, otherwise it
   * overflows its container.
   */
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  samples?: number;
  /**
   * `envelope` (default) draws a mirrored amplitude band — the voice-note look.
   * `line` draws the raw oscilloscope trace, which reads as a dense comb for
   * anything but very short windows.
   */
  variant?: "envelope" | "line";
  mirror?: boolean;
  windowInSeconds?: number;
  /** Scales the waveform vertically without changing the SVG height. */
  amplitudeScale?: number;
  /** Normalize the visible window so quiet audio still draws as a readable waveform. */
  normalize?: boolean;
  /** 0-1 progress used to tint the played portion. Defaults to composition time. */
  progress?: number;
  /** Unplayed portion. Defaults to `strokeColor` knocked back, which reads on any background. */
  mutedStrokeColor?: string;
  baselineColor?: string;
  showBaseline?: boolean;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Fallback drawn while audio data loads (and in environments without the
 * source). Layered incommensurate frequencies plus a syllable-rate envelope
 * read as speech rather than as a test tone.
 */
function placeholderWaveform(samples: number, frame: number) {
  return Array.from({ length: samples }, (_, index) => {
    const t = index / Math.max(1, samples - 1);
    const drift = frame * 0.06;
    const carrier =
      Math.sin(index * 0.52 + drift) * 0.62 +
      Math.sin(index * 0.19 - drift * 0.7) * 0.26 +
      Math.sin(index * 1.13 + drift * 1.6) * 0.12;
    const syllables =
      0.55 +
      Math.sin(t * Math.PI * 5.5 - drift * 0.5) * 0.3 +
      Math.sin(t * Math.PI * 2.1) * 0.15;
    const fadeEdges = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));

    return carrier * Math.max(0.08, syllables) * fadeEdges * 0.62;
  });
}

function pathFromWaveform({
  waveform,
  width,
  height,
  amplitudeScale,
  normalize,
  mirror = false,
}: {
  waveform: number[];
  width: number;
  height: number;
  amplitudeScale: number;
  normalize: boolean;
  mirror?: boolean;
}) {
  const centerY = height / 2;
  const drawableHeight = height * 0.42;
  const maxAmplitude = Math.max(
    0.001,
    ...waveform.map((value) => Math.abs(value)),
  );

  return createSmoothSvgPath({
    points: waveform.map((value, index) => {
      const sourceValue = normalize ? value / maxAmplitude : value;
      const normalized = Math.max(
        -1,
        Math.min(1, sourceValue * amplitudeScale),
      );
      const y = centerY + normalized * drawableHeight * (mirror ? -1 : 1);

      return {
        x: (index / Math.max(1, waveform.length - 1)) * width,
        y,
      };
    }),
  });
}

/**
 * Peak-per-bucket envelope. The raw trace swings far faster than the pixel
 * budget of a waveform strip, so drawing every sample renders as a comb —
 * bucketed peaks keep the loudness shape that actually carries meaning.
 */
function toEnvelope(waveform: number[], buckets: number) {
  const bucketSize = waveform.length / buckets;

  return Array.from({ length: buckets }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.min(
      waveform.length,
      Math.max(start + 1, Math.floor((index + 1) * bucketSize)),
    );
    let peak = 0;

    for (let cursor = start; cursor < end; cursor += 1) {
      peak = Math.max(peak, Math.abs(waveform[cursor]));
    }

    return peak;
  });
}

function envelopePath({
  envelope,
  width,
  height,
  amplitudeScale,
  normalize,
}: {
  envelope: number[];
  width: number;
  height: number;
  amplitudeScale: number;
  normalize: boolean;
}) {
  const centerY = height / 2;
  const drawableHeight = height * 0.46;
  const maxAmplitude = Math.max(0.001, ...envelope);
  const points = envelope.map((value, index) => ({
    x: (index / Math.max(1, envelope.length - 1)) * width,
    offset:
      Math.min(1, (normalize ? value / maxAmplitude : value) * amplitudeScale) *
      drawableHeight,
  }));

  const top = createSmoothSvgPath({
    points: points.map((point) => ({ x: point.x, y: centerY - point.offset })),
  });
  const bottom = createSmoothSvgPath({
    points: [...points]
      .reverse()
      .map((point) => ({ x: point.x, y: centerY + point.offset })),
  });

  return `${top} ${bottom.replace(/^M/, "L")} Z`;
}

export const WaveformLine: React.FC<WaveformLineProps> = ({
  src,
  width: widthProp,
  height = 144,
  strokeColor = "#ff6b00",
  strokeWidth = 4,
  samples,
  variant = "envelope",
  mirror = false,
  windowInSeconds = 1.2,
  amplitudeScale,
  normalize = true,
  progress,
  mutedStrokeColor,
  baselineColor,
  showBaseline = true,
}) => {
  const clipId = useId().replace(/:/g, "-");
  // Defaulting the unplayed shape to a fixed near-black made it disappear on a
  // dark stage, which reads as a waveform that stops halfway across the frame.
  // Deriving it from the stroke keeps it visible whatever it is drawn on.
  const mutedColor = mutedStrokeColor ?? strokeColor;
  const mutedOpacity = mutedStrokeColor ? undefined : 0.2;
  const isEnvelope = variant === "envelope";
  // Envelope buckets read best sparser than the trace they summarise, and the
  // trace itself needs oversampling for the peaks to be meaningful.
  const buckets = samples ?? (isEnvelope ? 88 : 128);
  const traceSamples = isEnvelope ? buckets * 6 : buckets;
  const amplitude = amplitudeScale ?? (isEnvelope ? 0.94 : 0.48);
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width: compositionWidth } = useVideoConfig();
  const width = widthProp ?? compositionWidth;
  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const playedProgress =
    progress ?? clamp01(frame / Math.max(1, durationInFrames - 1));

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds,
  });

  const waveform = audioData
    ? visualizeAudioWaveform({
        fps,
        frame,
        audioData,
        numberOfSamples: traceSamples,
        windowInSeconds,
        dataOffsetInSeconds,
      })
    : placeholderWaveform(traceSamples, frame);

  const path = isEnvelope
    ? envelopePath({
        envelope: toEnvelope(waveform, buckets),
        width,
        height,
        amplitudeScale: amplitude,
        normalize,
      })
    : pathFromWaveform({
        waveform,
        width,
        height,
        amplitudeScale: amplitude,
        normalize,
      });
  const mirroredPath =
    mirror && !isEnvelope
      ? pathFromWaveform({
          waveform,
          width,
          height,
          amplitudeScale: amplitude,
          normalize,
          mirror: true,
        })
      : null;

  // The envelope is a closed shape, so it is filled; the raw trace is a line.
  const paint = (color: string, opacity?: number) =>
    isEnvelope
      ? ({ fill: color, fillOpacity: opacity, stroke: "none" } as const)
      : ({
          fill: "none",
          stroke: color,
          strokeOpacity: opacity,
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        } as const);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", maxWidth: "100%", opacity: enter }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={width * clamp01(playedProgress)} height={height} />
        </clipPath>
      </defs>
      {showBaseline ? (
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke={baselineColor ?? strokeColor}
          strokeOpacity={baselineColor ? 1 : 0.14}
          strokeWidth={1}
        />
      ) : null}
      <path d={path} {...paint(mutedColor, mutedOpacity)} />
      {mirroredPath ? (
        <path d={mirroredPath} {...paint(mutedColor, mutedOpacity)} />
      ) : null}
      <g clipPath={`url(#${clipId})`}>
        <path d={path} {...paint(strokeColor)} />
        {mirroredPath ? (
          <path d={mirroredPath} {...paint(strokeColor, 0.46)} />
        ) : null}
      </g>
    </svg>
  );
};
