import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type DynamicGridProps = {
  backgroundColor?: string;
  lineColor?: string;
  sweepColor?: string;
  spacing?: number;
  speed?: number;
  sweepDurationInFrames?: number;
};

export const DynamicGrid: React.FC<DynamicGridProps> = ({
  backgroundColor = "#080810",
  lineColor = "rgba(255,255,255,0.1)",
  sweepColor = "rgba(232,184,109,0.55)",
  spacing = 64,
  speed = 0.4,
  sweepDurationInFrames = 150,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Wraps every `spacing` px, so the pattern re-aligns with itself on wrap —
  // a hard modulo on frame instead would snap the drift back to zero.
  const driftPx = ((frame * speed) % spacing + spacing) % spacing;

  const sweepT = interpolate(frame % sweepDurationInFrames, [0, sweepDurationInFrames], [0, 1], {
    easing: EASING.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diag = width + height;
  const sweepOffset = interpolate(sweepT, [0, 1], [-diag * 0.3, diag * 0.5]);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `${driftPx}px ${driftPx}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -height * 0.5,
          left: -width * 0.2,
          width: 260,
          height: height * 2,
          transform: `translateX(${sweepOffset}px) rotate(18deg)`,
          background: `linear-gradient(90deg, transparent, ${sweepColor}, transparent)`,
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
