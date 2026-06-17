import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MeshGradientBgProps = {
  backgroundColor?: string;
  /** Blob accent colors */
  colors?: [string, string, string];
  intensity?: number;
};

const DEFAULT_COLORS: [string, string, string] = [
  "rgba(232,184,109,0.22)",
  "rgba(45,212,191,0.16)",
  "rgba(244,114,182,0.14)",
];

type BlobConfig = {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  phase: number;
};

const BLOBS: BlobConfig[] = [
  { x: 18, y: 38, size: 52, driftX: 14, driftY: 10, phase: 0 },
  { x: 72, y: 24, size: 44, driftX: -12, driftY: 16, phase: 1.4 },
  { x: 58, y: 72, size: 48, driftX: 10, driftY: -14, phase: 2.2 },
  { x: 32, y: 68, size: 36, driftX: -8, driftY: -9, phase: 3.1 },
];

export const MeshGradientBg: React.FC<MeshGradientBgProps> = ({
  backgroundColor = "#080810",
  colors = DEFAULT_COLORS,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = interpolate(
    frame,
    [0, fps * 6],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "extend",
      easing: EASING.editorial,
    },
  );

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {BLOBS.map((blob, index) => {
        const wave = Math.sin(frame / (fps * 2.4) + blob.phase);
        const waveY = Math.cos(frame / (fps * 3.1) + blob.phase * 0.7);
        const x = blob.x + wave * blob.driftX * intensity;
        const y = blob.y + waveY * blob.driftY * intensity;
        const scale = 0.92 + breathe * 0.12 + wave * 0.04;

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
              background: `radial-gradient(circle at 42% 38%, ${colors[index % colors.length]}, transparent 68%)`,
              filter: "blur(42px)",
              opacity: 0.55 + wave * 0.12,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 120%, rgba(0,0,0,0.42), transparent 58%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
