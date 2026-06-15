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
  color = "#f472b6",
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
              border: `2px solid ${color}`,
              opacity: Math.max(0.15, 0.7 - index * 0.2),
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${Math.round(32 * intensity)}px ${color}55`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${color} 0%, ${color}cc 100%)`,
          opacity: 0.92,
          transform: `scale(${0.82 + intensity * 0.28})`,
          boxShadow: `0 0 ${Math.round(52 * intensity)}px ${color}88`,
        }}
      />
    </div>
  );
};
