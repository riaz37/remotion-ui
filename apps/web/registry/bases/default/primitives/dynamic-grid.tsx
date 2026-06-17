import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type DynamicGridProps = {
  backgroundColor?: string;
  dotColor?: string;
  spacing?: number;
  dotSize?: number;
  drift?: number;
};

export const DynamicGrid: React.FC<DynamicGridProps> = ({
  backgroundColor = "#080810",
  dotColor = "rgba(255,255,255,0.08)",
  spacing = 48,
  dotSize = 2,
  drift = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loop = fps * 8;
  const progress = interpolate(frame % loop, [0, loop], [0, 1], {
    easing: EASING.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offsetX = progress * spacing * drift;
  const offsetY = progress * spacing * 0.35 * drift;
  const pulse = 0.75 + Math.sin(frame / (fps * 1.6)) * 0.12;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          opacity: pulse,
          backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.35,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: `${spacing * 2}px ${spacing * 2}px`,
          backgroundPosition: `${-offsetX * 0.5}px ${-offsetY * 0.5}px`,
        }}
      />
    </AbsoluteFill>
  );
};
