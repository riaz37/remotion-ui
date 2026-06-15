import {
  createSmoothSvgPath,
  useWindowedAudioData,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

export type WaveformLineProps = {
  src: string;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  samples?: number;
  mirror?: boolean;
  windowInSeconds?: number;
};

export const WaveformLine: React.FC<WaveformLineProps> = ({
  src,
  height = 120,
  strokeColor = "#c084fc",
  strokeWidth = 3,
  samples = 256,
  mirror = false,
  windowInSeconds = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds: 30,
  });

  if (!audioData) {
    const placeholder = Array.from({ length: 48 })
      .map((_, index) => {
        const x = (index / 47) * width;
        const y =
          height / 2 +
          Math.sin((frame + index * 5) / 8) * (height * 0.22);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="waveform-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={placeholder}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#waveform-glow)"
        />
      </svg>
    );
  }

  const waveform = visualizeAudioWaveform({
    fps,
    frame,
    audioData,
    numberOfSamples: samples,
    windowInSeconds,
    dataOffsetInSeconds,
  });

  const points = waveform.map((value, index) => ({
    x: (index / Math.max(1, waveform.length - 1)) * width,
    y: height / 2 + (value * height) / 2,
  }));
  const path = createSmoothSvgPath({ points });
  const mirroredPath = mirror
    ? createSmoothSvgPath({
        points: points.map((point) => ({
          x: point.x,
          y: height - point.y,
        })),
      })
    : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <filter id="waveform-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter="url(#waveform-glow)"
      />
      {mirroredPath ? (
        <path
          d={mirroredPath}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.4}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
};
