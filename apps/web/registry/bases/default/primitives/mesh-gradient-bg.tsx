import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MeshGradientBgProps = {
  backgroundColor?: string;
  /** Blob accent colors — solid hex, blended additively over the stage. */
  colors?: [string, string, string];
  intensity?: number;
};

const DEFAULT_COLORS: [string, string, string] = ["#e8b86d", "#2dd4bf", "#f472b6"];

type BlobConfig = {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  phase: number;
  period: number;
  blur: number;
  alpha: number;
};

const BLOBS: BlobConfig[] = [
  { x: 20, y: 30, size: 60, driftX: 12, driftY: 9, phase: 0, period: 2.6, blur: 60, alpha: 0.55 },
  { x: 78, y: 22, size: 48, driftX: -10, driftY: 14, phase: 1.7, period: 3.3, blur: 46, alpha: 0.46 },
  { x: 58, y: 78, size: 54, driftX: 9, driftY: -12, phase: 3.4, period: 2.9, blur: 54, alpha: 0.5 },
];

export const MeshGradientBg: React.FC<MeshGradientBgProps> = ({
  backgroundColor = "#080810",
  colors = DEFAULT_COLORS,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Continuous breathing scale — driven by a sine so it loops with no seam,
  // unlike a clamped ramp that would freeze once it reached its endpoint.
  const breathe = interpolate(Math.sin(time / 5.5), [-1, 1], [0, 1], {
    easing: EASING.editorial,
  });

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + breathe * 0.03})` }}>
        {BLOBS.map((blob, index) => {
          const wave = Math.sin(time / blob.period + blob.phase);
          const waveY = Math.cos(time / (blob.period * 1.3) + blob.phase * 0.7);
          const x = blob.x + wave * blob.driftX * intensity;
          const y = blob.y + waveY * blob.driftY * intensity;
          const scale = 0.94 + breathe * 0.1 + wave * 0.05;
          const color = colors[index % colors.length];

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: `${blob.size}%`,
                aspectRatio: "1",
                transform: `translate(-50%, -50%) scale(${scale})`,
                borderRadius: "50%",
                background: `radial-gradient(circle at 42% 38%, ${color}, transparent 70%)`,
                filter: `blur(${blob.blur}px)`,
                opacity: blob.alpha * (0.85 + wave * 0.15),
                mixBlendMode: "screen",
              }}
            />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 115%, rgba(0,0,0,0.5), transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
