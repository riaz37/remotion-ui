import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type WallLogo = {
  /** Wordmark text. Kept short — a logo wall is scanned, not read. */
  name: string;
  /** Brand colour the tile warms up to. Falls back to `accentColor`. */
  color?: string;
  /**
   * Glyph in the mark beside the wordmark. Defaults to the name's first letter.
   */
  glyph?: string;
};

export type LogoWallProps = {
  logos?: WallLogo[];
  /** Line above the wall. Omit to drop it. */
  eyebrow?: string;
  /** Heading above the wall. Omit to drop it. */
  title?: string;
  /** Tiles per row. */
  columns?: number;
  /** Second the first tile arrives. */
  startAtSeconds?: number;
  /** Seconds between tiles arriving, in reading order. */
  arriveStaggerSeconds?: number;
  /**
   * Seconds between diagonals of the colour sweep. Tiles on one diagonal warm
   * together, which is what makes the sweep cross the wall rather than run down
   * it like a list.
   */
  staggerSeconds?: number;
  /** How long one tile takes to go from grey to brand colour. */
  warmSeconds?: number;
  /**
   * Seconds the finished wall holds before it retreats. Omit to leave it up for
   * the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_LOGOS: WallLogo[] = [
  { name: "Northstar", color: "#E8B86D" },
  { name: "Halcyon", color: "#7DD3E8" },
  { name: "Fernweh", color: "#9BD4A0" },
  { name: "Orbital", color: "#C99BE8" },
  { name: "Lumen", color: "#8FB8F0" },
  { name: "Tidewater", color: "#E89B9B" },
  { name: "Kestrel", color: "#E8B86D" },
  { name: "Marrow", color: "#7DD3E8" },
];

/** Beat plan in seconds. Tile times come from the props. */
const T = {
  head: 0.08,
  headFor: 0.4,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A client wall that comes up to colour: tiles arrive grey and desaturated, then
 * warm to their brand colour on a diagonal sweep, the mark filling before the
 * wordmark so each tile has an internal order rather than switching on.
 *
 * The sweep is driven by `row + column`, so it crosses the wall as one wave at
 * any grid width — a per-index stagger would run in reading order and read as a
 * list, which is the opposite of what a logo wall is for.
 */
export const LogoWall: React.FC<LogoWallProps> = ({
  logos = DEFAULT_LOGOS,
  eyebrow = "Trusted by",
  title = "Teams shipping with RemotionUI",
  columns = 4,
  startAtSeconds = 0.32,
  arriveStaggerSeconds = 0.06,
  staggerSeconds = 0.24,
  warmSeconds = 0.6,
  holdSeconds,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const wallW = Math.min(width - safe.paddingLeft - safe.paddingRight, 900 * u);
  const gap = 14 * u;
  const tileW = (wallW - gap * (columns - 1)) / columns;
  const tileH = 88 * u;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: wallW,
          opacity: 1 - exit,
          transform: `translateY(${exit * 26 * u}px)`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              color: accentColor,
              fontSize: 13 * u,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: headIn,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {title ? (
          <div
            style={{
              marginTop: 8 * u,
              marginBottom: 24 * u,
              color: palette.fg,
              fontSize: 30 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 12 * u}px)`,
            }}
          >
            {title}
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap }}>
          {logos.map((logo, index) => {
            const row = Math.floor(index / columns);
            const column = index % columns;
            // Tiles arrive fast in reading order so the wall is whole early;
            // the colour is the slow part, sweeping the diagonal afterwards.
            const arriveAt = startAtSeconds + index * arriveStaggerSeconds;
            const warmAt = startAtSeconds + 0.3 + (row + column) * staggerSeconds;
            const arrive = ease(arriveAt, arriveAt + 0.36);
            const warm = ease(warmAt, warmAt + warmSeconds, EASING.editorial);
            // The mark reaches full colour ahead of the wordmark, so a tile has
            // an internal order instead of switching on all at once.
            const markWarm = interpolate(warm, [0, 0.7], [0, 1], clamp);
            const color = logo.color ?? accentColor;

            return (
              <div
                key={logo.name}
                style={{
                  width: tileW,
                  height: tileH,
                  borderRadius: 14 * u,
                  background: palette.band,
                  border: `1px solid ${
                    warm > 0.5 ? `${color}44` : palette.border
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10 * u,
                  opacity: arrive,
                  transform: `scale(${0.94 + arrive * 0.06})`,
                  // One filter on the tile, not per element: saturation and
                  // brightness have to move together or the grey stage looks
                  // muddy rather than monochrome.
                  filter: `saturate(${warm}) brightness(${0.72 + warm * 0.28})`,
                }}
              >
                <div
                  style={{
                    width: 30 * u,
                    height: 30 * u,
                    borderRadius: 9 * u,
                    display: "grid",
                    placeItems: "center",
                    background: `linear-gradient(140deg, ${color}, ${color}88)`,
                    color: theme === "dark" ? "#12100C" : "#FFFFFF",
                    fontSize: 16 * u,
                    fontWeight: 800,
                    opacity: 0.45 + markWarm * 0.55,
                  }}
                >
                  {logo.glyph ?? logo.name[0]}
                </div>
                {/* The wordmark carries the brand colour and lets the tile's
                    own saturate() take it away, so the grey stage is a real
                    monochrome of the finished tile rather than a second design. */}
                <span
                  style={{
                    color,
                    fontSize: 19 * u,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
