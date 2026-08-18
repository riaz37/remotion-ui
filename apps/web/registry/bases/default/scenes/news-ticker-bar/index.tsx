import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type NewsTickerBarProps = {
  /** Headlines cycled through the crawl, separated by a bullet. */
  headlines: string[];
  /** Standing flag on the left — BREAKING, MARKETS, LIVE. */
  flag?: string;
  /** Second line under the crawl. Omit for a single-line bar. */
  strapline?: string;
  /** Clock or dateline pinned to the right edge. Omit to hide it. */
  timestamp?: string;
  /** Crawl speed in units per second. */
  pixelsPerSecond?: number;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Seconds the bar holds before it retreats. Omit to leave it up. */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  bar: 0,
  barFor: 0.42,
  flag: 0.24,
  /** The crawl starts once the bar has finished opening. */
  crawl: 0.4,
  strapline: 0.46,
  exitFor: 0.38,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Broadcast lower ticker: a standing flag, a headline crawl that never stops,
 * and optional strapline and dateline furniture. `infinite-marquee` is the
 * generic looping-text primitive — this is the dressed news bar built on the
 * same idea, with the chrome a broadcast frame needs.
 */
export const NewsTickerBar: React.FC<NewsTickerBarProps> = ({
  headlines,
  flag = "Breaking",
  strapline,
  timestamp,
  pixelsPerSecond = 118,
  accentColor = "#F97362",
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const bar = spring({
    frame: frame - at(T.bar),
    fps,
    config: { damping: 19, stiffness: 150, mass: 0.8 },
  });
  const open = ease(T.bar, T.bar + T.barFor, EASING.editorial);
  const flagIn = ease(T.flag, T.flag + 0.38);
  const straplineIn = strapline ? ease(T.strapline, T.strapline + 0.42) : 0;

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  // Two copies of the run chase each other, so the crawl wraps without a gap.
  // The estimate only has to be a stable upper bound — anything short of the
  // real text width would let the seam show.
  const run = headlines.join("  •  ");
  const runWidth = run.length * 11.2 * u;
  const crawled = Math.max(0, (frame - at(T.crawl)) / fps) * speed * pixelsPerSecond * u;
  const offset = runWidth > 0 ? -(crawled % runWidth) : 0;

  const barHeight = (strapline ? 96 : 62) * u;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
          display: "flex",
          flexDirection: "column",
          background: `${palette.window}F5`,
          borderTop: `${2 * u}px solid ${accentColor}`,
          boxShadow: `0 ${-14 * u}px ${40 * u}px ${palette.shadow}`,
          // Rises from the frame edge, then drops back through it.
          translate: `0 ${(1 - bar) * barHeight + exit * barHeight}px`,
          opacity: open,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 62 * u,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              padding: `0 ${20 * u}px`,
              background: accentColor,
              color: "#0B0C11",
              fontSize: 19 * u,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              // The flag wipes out of the left edge ahead of the crawl.
              clipPath: `inset(0 ${(1 - flagIn) * 100}% 0 0)`,
            }}
          >
            {flag}
          </div>

          <div
            style={{
              position: "relative",
              flex: 1,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                translate: `${offset}px`,
              }}
            >
              {[0, 1].map((copy) => (
                <span
                  key={copy}
                  style={{
                    paddingLeft: 26 * u,
                    paddingRight: 26 * u,
                    width: runWidth,
                    color: palette.fg,
                    fontSize: 22 * u,
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {run}
                </span>
              ))}
            </div>
            {/* Headlines dissolve into the right edge instead of being sliced
                clean off against the dateline. */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 46 * u,
                height: "100%",
                background: `linear-gradient(90deg, transparent, ${palette.window})`,
              }}
            />
          </div>

          {timestamp ? (
            <div
              style={{
                flexShrink: 0,
                alignSelf: "stretch",
                display: "flex",
                alignItems: "center",
                padding: `0 ${20 * u}px`,
                borderLeft: `1px solid ${palette.border}`,
                background: palette.window,
                color: palette.dim,
                fontSize: 18 * u,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
              }}
            >
              {timestamp}
            </div>
          ) : null}
        </div>

        {strapline ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              padding: `0 ${20 * u}px`,
              borderTop: `1px solid ${palette.border}`,
              background: palette.header,
              color: palette.dim,
              fontSize: 18 * u,
              fontWeight: 500,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              opacity: straplineIn,
              translate: `0 ${(1 - straplineIn) * 6 * u}px`,
            }}
          >
            {strapline}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
