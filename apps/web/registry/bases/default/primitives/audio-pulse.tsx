import { useCurrentFrame } from "remotion";
import { scaleFrequenciesForDisplay, useSpectrumBars } from "@/remotion/lib/audio-viz-utils";

export type AudioPulseProps = {
  src: string;
  size?: number;
  color?: string;
  ringCount?: number;
  sensitivity?: number;
};

export const AudioPulse: React.FC<AudioPulseProps> = ({
  src,
  size = 240,
  color = "#60a5fa",
  ringCount = 3,
  sensitivity = 1,
}) => {
  const frame = useCurrentFrame();
  const { frequencies } = useSpectrumBars({ src, numberOfSamples: 128 });
  const scaled = frequencies ? scaleFrequenciesForDisplay(frequencies) : null;
  const bass = scaled
    ? scaled.slice(0, 24).reduce((sum, value) => sum + value, 0) / 24
    : 0.35 + Math.sin(frame / 8) * 0.18;
  const intensity = Math.max(0, Math.min(1, bass * sensitivity));

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {Array.from({ length: ringCount }).map((_, index) => {
        const offset = index / Math.max(1, ringCount);
        const scale = 0.58 + offset * 0.26 + intensity * (0.26 + offset * 0.2);
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `3px solid ${color}`,
              opacity: Math.max(0.18, 0.72 - index * 0.18),
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${Math.round(28 * intensity)}px ${color}66`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background: color,
          opacity: 0.9,
          transform: `scale(${0.82 + intensity * 0.28})`,
          boxShadow: `0 0 ${Math.round(48 * intensity)}px ${color}`,
        }}
      />
    </div>
  );
};
