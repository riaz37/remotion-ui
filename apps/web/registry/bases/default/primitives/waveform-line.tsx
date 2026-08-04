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
  mirror?: boolean;
  windowInSeconds?: number;
  /** Scales the waveform vertically without changing the SVG height. */
  amplitudeScale?: number;
  /** Normalize the visible window so quiet audio still draws as a readable waveform. */
  normalize?: boolean;
  /** 0-1 progress used to tint the played portion. Defaults to composition time. */
  progress?: number;
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

export const WaveformLine: React.FC<WaveformLineProps> = ({
  src,
  width: widthProp,
  height = 144,
  strokeColor = "#ff6b00",
  strokeWidth = 4,
  samples = 128,
  mirror = false,
  windowInSeconds = 1.2,
  amplitudeScale = 0.48,
  normalize = true,
  progress,
  mutedStrokeColor = "rgba(17, 17, 17, 0.18)",
  baselineColor = "rgba(17, 17, 17, 0.12)",
  showBaseline = true,
}) => {
  const clipId = useId().replace(/:/g, "-");
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
        numberOfSamples: samples,
        windowInSeconds,
        dataOffsetInSeconds,
      })
    : placeholderWaveform(samples, frame);

  const path = pathFromWaveform({
    waveform,
    width,
    height,
    amplitudeScale,
    normalize,
  });
  const mirroredPath = mirror
    ? pathFromWaveform({
        waveform,
        width,
        height,
        amplitudeScale,
        normalize,
        mirror: true,
      })
    : null;

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
          stroke={baselineColor}
          strokeWidth={1}
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={mutedStrokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mirroredPath ? (
        <path
          d={mirroredPath}
          fill="none"
          stroke={mutedStrokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      <g clipPath={`url(#${clipId})`}>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {mirroredPath ? (
          <path
            d={mirroredPath}
            fill="none"
            stroke={strokeColor}
            strokeOpacity={0.46}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
    </svg>
  );
};
