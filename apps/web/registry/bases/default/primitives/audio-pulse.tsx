import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  DEFAULT_AUDIO_WINDOW_SECONDS,
  scaleFrequenciesForDisplay,
  useSpectrumBars,
} from "@/remotion/lib/audio-viz-utils";

export type AudioPulseProps = {
  src: string;
  size?: number;
  color?: string;
  ringCount?: number;
  sensitivity?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>` to avoid discontinuities.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const AudioPulse: React.FC<AudioPulseProps> = ({
  src,
  size = 240,
  color = "#e8b86d",
  ringCount = 3,
  sensitivity = 1,
  frame: frameOverride,
}) => {
  const frame = frameOverride ?? useCurrentFrame();
  const { fps } = useVideoConfig();
  const { frequencies } = useSpectrumBars({
    src,
    numberOfSamples: 128,
    windowInSeconds: DEFAULT_AUDIO_WINDOW_SECONDS,
    frame,
  });
  const scaled = frequencies ? scaleFrequenciesForDisplay(frequencies) : null;

  const energy = scaled
    ? scaled
        .slice(0, 28)
        .reduce((sum, value) => sum + value, 0) / 28
    : null;

  // Deterministic fallback when audio isn't available (e.g. during loading / remote audio blocked).
  // Uses the provided/derived `frame`, so it stays stable inside `<Sequence from={...}>`.
  const fallback =
    0.28 +
    0.22 * Math.sin((frame / fps) * Math.PI * 2 * 0.85) +
    0.08 * Math.sin((frame / fps) * Math.PI * 2 * 2.1 + 1.4);

  const raw = clamp01(((energy ?? fallback) * sensitivity) / 0.9);

  // Smooth + compress: reduces jitter while keeping punch on peaks.
  const compressed = Math.pow(raw, 0.72);
  const intensity = smoothstep(compressed);
  const idle = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * 0.18);
  const breathe = 0.035 * idle * (scaled ? 0.55 : 1);

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: "-14%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${color}14 0%, transparent 62%)`,
          filter: "blur(10px)",
          opacity: 0.78 + intensity * 0.28,
          transform: `scale(${0.96 + intensity * 0.06})`,
          pointerEvents: "none",
        }}
      />
      {Array.from({ length: ringCount }).map((_, index) => {
        const offset = index / Math.max(1, ringCount);
        const baseScale = 0.56 + offset * 0.25;
        const phase = (frame / fps) * Math.PI * 2 * 0.42 + index * 1.7;
        const wobble = Math.sin(phase) * (0.012 + offset * 0.01);
        const scale =
          baseScale + intensity * (0.28 + offset * 0.22) + breathe + wobble;
        const ringOpacity = lerp(0.72, 0.22, offset) * (0.65 + intensity * 0.35);
        const ringWidth = lerp(2.3, 1.35, offset);
        const glow = lerp(10, 46, intensity) * (1 - offset * 0.55);
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${ringWidth}px solid ${color}`,
              opacity: ringOpacity,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${Math.round(glow)}px ${color}3a, 0 0 ${Math.round(
                glow * 0.55,
              )}px ${color}24`,
              filter: `blur(${lerp(0, 0.55, offset)}px) saturate(1.05)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background: [
            `radial-gradient(circle at 32% 30%, ${color} 0%, ${color}cc 48%, ${color}66 100%)`,
            `conic-gradient(from ${Math.round(frame * 1.2)}deg, ${color}20, ${color}55, ${color}12, ${color}33, ${color}20)`,
          ].join(", "),
          opacity: 0.92 + intensity * 0.05,
          transform: `scale(${0.78 + intensity * 0.34 + breathe * 0.75})`,
          boxShadow: `0 0 ${Math.round(58 * intensity)}px ${color}55, inset 0 0 24px ${color}2b`,
          filter: `saturate(${1.05 + intensity * 0.35})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 36% 32%, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0) 52%)",
          opacity: 0.5 + intensity * 0.18,
          transform: `scale(${0.92 + intensity * 0.08})`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
