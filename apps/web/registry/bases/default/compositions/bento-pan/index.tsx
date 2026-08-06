import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING_EXIT } from "@/remotion/lib/timing";

export type BentoTile = {
  w: number;
  h: number;
  color: string;
};

export type BentoPanProps = {
  backgroundColor?: string;
  tiles?: BentoTile[];
};

const DEFAULT_TILES: BentoTile[] = [
  { w: 32, h: 28, color: "rgba(232,184,109,0.2)" },
  { w: 28, h: 36, color: "rgba(45,212,191,0.18)" },
  { w: 36, h: 30, color: "rgba(244,114,182,0.16)" },
  { w: 30, h: 34, color: "rgba(245,158,11,0.18)" },
];

export const BentoPan: React.FC<BentoPanProps> = ({
  backgroundColor = "#080810",
  tiles = DEFAULT_TILES,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Enter + hold-with-life: the camera keeps drifting across the grid for
  // the whole hold instead of stopping dead once the initial pan lands.
  const panProgress = interpolate(frame, [0, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = panProgress * -width * 0.26;
  const panY = panProgress * -height * 0.14;

  // A slow breathing rotation keeps the hold visually alive between the pan
  // settling and the exit beat kicking in.
  const breathe = Math.sin((frame / fps) * Math.PI * 0.6) * 0.6;

  // Exit: the grid settles a touch closer and fades through the vignette
  // rather than freezing on the final pan position. Opacity fades linearly
  // so the beat reads clearly through the whole window (an ease-in curve
  // here would keep it near-invisible until the last few frames), and it
  // fully resolves a few frames before the composition ends.
  const exitWindowStart = 130;
  const exitWindowEnd = 172;
  const exit = interpolate(frame, [exitWindowStart, exitWindowEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(exit, [0, 1], [1, 1.08], {
    easing: EASING_EXIT,
  });
  const exitOpacity = 1 - exit;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          opacity: exitOpacity,
          transform: `translate(${panX}px, ${panY}px) scale(${exitScale}) rotate(${-6 + breathe}deg)`,
        }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const tile = tiles[i % tiles.length]!;
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
