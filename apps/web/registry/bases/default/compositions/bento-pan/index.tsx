import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type BentoPanProps = {
  backgroundColor?: string;
};

const TILES = [
  { w: 32, h: 28, color: "rgba(232,184,109,0.2)" },
  { w: 28, h: 36, color: "rgba(45,212,191,0.18)" },
  { w: 36, h: 30, color: "rgba(244,114,182,0.16)" },
  { w: 30, h: 34, color: "rgba(245,158,11,0.18)" },
];

export const BentoPan: React.FC<BentoPanProps> = ({
  backgroundColor = "#080810",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const panX = interpolate(frame, [0, 120], [0, -width * 0.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(frame, [0, 120], [0, -height * 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          transform: `translate(${panX}px, ${panY}px) rotate(-6deg)`,
        }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const tile = TILES[i % TILES.length]!;
          const enter = spring({
            frame: frame - i * 3,
            fps,
            config: { damping: 20, stiffness: 100, mass: 0.85 },
            durationInFrames: 24,
          });
          return (
            <div
              key={i}
              style={{
                width: tile.w * 8,
                height: tile.h * 8,
                borderRadius: 20,
                background: tile.color,
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: enter,
                transform: `scale(${0.92 + enter * 0.08})`,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(8,8,16,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
