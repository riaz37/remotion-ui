import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING_EXIT } from "@/remotion/lib/timing";

export type BentoTile = {
  /** Small caps line above the figure — what the number is. */
  label: string;
  /** The figure itself. This is the part that has to read at tile size. */
  value: string;
  /** Trailing note: a delta, a unit, a status. */
  note?: string;
  /** Bar heights, 0–1, drawn along the bottom of the card. */
  trend?: number[];
  /** Card tint and the colour the figure's accent takes. */
  color: string;
};

export type BentoPanProps = {
  backgroundColor?: string;
  tiles?: BentoTile[];
};

/**
 * Nine cards, because a 3x3 grid under a pan keeps the cards big enough for
 * their figures to survive a 308px tile. Sixteen small ones read as wallpaper.
 */
const DEFAULT_TILES: BentoTile[] = [
  { label: "Views", value: "124K", note: "+18%", color: "#e8b86d", trend: [0.32, 0.5, 0.44, 0.68, 0.82, 1] },
  { label: "Watch time", value: "48m", note: "+6%", color: "#2dd4bf", trend: [0.6, 0.55, 0.7, 0.66, 0.85, 0.92] },
  { label: "Shares", value: "3.2K", note: "-4%", color: "#f472b6", trend: [0.8, 0.74, 0.86, 0.62, 0.58, 0.5] },
  { label: "Installs", value: "9,480", note: "this week", color: "#f59e0b", trend: [0.24, 0.38, 0.52, 0.6, 0.78, 0.96] },
  { label: "Components", value: "200", note: "in registry", color: "#e8b86d" },
  { label: "Render time", value: "42s", note: "1080p", color: "#2dd4bf", trend: [0.9, 0.72, 0.66, 0.54, 0.48, 0.4] },
  { label: "Retention", value: "68%", note: "30s mark", color: "#f472b6", trend: [1, 0.9, 0.82, 0.74, 0.7, 0.68] },
  { label: "Dependencies", value: "3", note: "runtime", color: "#f59e0b" },
  { label: "Clips shipped", value: "1,204", note: "all time", color: "#e8b86d", trend: [0.2, 0.34, 0.46, 0.62, 0.8, 1] },
];

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const BentoPan: React.FC<BentoPanProps> = ({
  backgroundColor = "#080810",
  tiles = DEFAULT_TILES,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const windowFrames = Number.isFinite(durationInFrames) ? durationInFrames : 180;
  /** The pan runs out with a quarter of the window left for the exit beat. */
  const panEnd = Math.max(30, Math.round(windowFrames * 0.72));
  /**
   * The exit straddles the last tenth of the window and settles on a dim grid
   * rather than on black: finishing at opacity 0 leaves the tail an empty plate.
   */
  const exitStart = Math.max(panEnd, windowFrames - 24);

  // Enter + hold-with-life: the camera keeps drifting across the grid for
  // the whole hold instead of stopping dead once the initial pan lands.
  // The move is centred on the grid's own position rather than starting there,
  // so neither end of the pan cuts a row through the middle of its figure.
  const panProgress = interpolate(frame, [0, panEnd], [0, 1], clamp);
  const panX = interpolate(panProgress, [0, 1], [width * 0.05, -width * 0.05]);
  const panY = interpolate(panProgress, [0, 1], [height * 0.022, -height * 0.022]);

  // A slow breathing rotation keeps the hold visually alive between the pan
  // settling and the exit beat kicking in. 100-frame period, so the 15/50/90
  // samples land on three different phases.
  const breathe = Math.sin((frame / fps) * Math.PI * 0.6) * 0.5;

  const exit = interpolate(frame, [exitStart, windowFrames], [0, 1], clamp);
  const exitScale = interpolate(exit, [0, 1], [1, 1.08], {
    ...clamp,
    easing: EASING_EXIT,
    output: "perceptual-scale",
  });
  const exitOpacity = interpolate(exit, [0, 1], [1, 0.35], clamp);

  // Sized so three rows very nearly fill the frame: a taller card lets the pan
  // cut the top row through its figure, a shorter one opens a bare band.
  const gap = Math.round(width * 0.028);
  const tileW = Math.round(width * 0.36);
  const tileH = Math.round(height * 0.315);
  const unit = Math.min(tileW / 346, tileH / 170);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-18%",
          display: "grid",
          gridTemplateColumns: "repeat(3, max-content)",
          justifyContent: "center",
          alignContent: "center",
          gap,
          opacity: exitOpacity,
          translate: `${panX}px ${panY}px`,
          scale: exitScale,
          rotate: `${-3 + breathe}deg`,
        }}
      >
        {tiles.map((tile, i) => {
          const enter = spring({
            frame: frame - i * 2,
            fps,
            config: { damping: 20, stiffness: 100, mass: 0.85 },
            durationInFrames: 24,
          });
          const enterScale = interpolate(enter, [0, 1], [0.92, 1], {
            ...clamp,
            output: "perceptual-scale",
          });

          return (
            <div
              key={tile.label}
              style={{
                width: tileW,
                height: tileH,
                borderRadius: 20 * unit,
                padding: `${22 * unit}px ${26 * unit}px`,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: `linear-gradient(150deg, ${tile.color}26, rgba(255,255,255,0.03))`,
                border: `1px solid ${tile.color}33`,
                opacity: enter,
                scale: enterScale,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 * unit }}>
                <div
                  style={{
                    width: 9 * unit,
                    height: 9 * unit,
                    borderRadius: "50%",
                    background: tile.color,
                  }}
                />
                <span
                  style={{
                    color: "rgba(250,250,250,0.62)",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 19 * unit,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {tile.label}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12 * unit,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <span
                  style={{
                    color: "#fafafa",
                    fontSize: 68 * unit,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {tile.value}
                </span>
                {tile.note ? (
                  <span
                    style={{
                      color: tile.color,
                      fontSize: 22 * unit,
                      fontWeight: 600,
                    }}
                  >
                    {tile.note}
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 7 * unit,
                  height: 34 * unit,
                }}
              >
                {(tile.trend ?? []).map((point, index) => (
                  <div
                    key={index}
                    style={{
                      width: 22 * unit,
                      // Bars grow in behind the figure once the card lands.
                      height: 34 * unit * point * enter,
                      borderRadius: 4 * unit,
                      background: `${tile.color}${index === (tile.trend?.length ?? 0) - 1 ? "cc" : "55"}`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(8,8,16,0.8) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
