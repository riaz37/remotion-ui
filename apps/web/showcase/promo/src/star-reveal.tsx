import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PathDraw } from "@/remotion/primitives/path-draw";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { springSnappy } from "@/remotion/lib/springs";
import { StargazerFeed } from "./stargazer-feed";

const { fontFamily: sansFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMonoFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * GitHub octicon "star-fill" (16x16) — the real star silhouette, not a glyph.
 * Numbers are fully spaced out (rather than using the terser SVG shorthand
 * with concatenated flags/decimals) because `@remotion/paths`, which
 * `PathDraw` uses to measure and animate the stroke, mis-splits runs like
 * `01.673.418` into the wrong argument count for the arc command.
 */
const STAR_PATH =
  "M 8 0.25 a 0.75 0.75 0 0 1 0.673 0.418 l 1.882 3.815 4.21 0.612 a 0.75 0.75 0 0 1 0.416 1.279 l -3.046 2.97 0.719 4.192 a 0.75 0.75 0 0 1 -1.088 0.791 L 8 12.347 l -3.766 1.98 a 0.75 0.75 0 0 1 -1.088 -0.79 l 0.72 -4.194 L 0.818 6.374 a 0.75 0.75 0 0 1 0.416 -1.28 l 4.21 -0.611 L 7.327 0.668 A 0.75 0.75 0 0 1 8 0.25 z";

export type StarRevealProps = {
  command?: string;
  starCount?: number;
  label?: string;
  caption?: string;
  windowTitle?: string;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
  /**
   * This scene's own length in frames (scene-local, not the whole
   * composition) — used to time the stargazer ticker's scroll pass so it
   * finishes before the cut to the next beat starts.
   */
  durationInFrames?: number;
  /** Set false to fall back to the plain star + count layout. */
  showStargazers?: boolean;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * The star count read back as a CLI would print it — a terminal window with a
 * `gh api` call, then its "output": the real GitHub star shape drawing itself
 * in and a count that lands with the same spring language every other beat
 * uses, instead of a generic ring-and-number stat card.
 */
export const StarReveal: React.FC<StarRevealProps> = ({
  command = "gh api repos/riaz37/remotion-ui --jq .stargazers_count",
  starCount = 50,
  label = "GitHub Stars",
  caption = "and counting",
  windowTitle = "gh",
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
  durationInFrames = 84,
  showStargazers = true,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const frame = rawFrame * speed;
  const palette = CODE_THEMES[theme];
  const safeArea = getSafeAreaPadding({ width, height });

  const windowIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const chromeIn = interpolate(frame, [4, 18], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const commandIn = interpolate(frame, [10, 20], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const dividerIn = interpolate(frame, [26, 34], [0, 1], clamp);

  const starProgress = spring({
    frame: frame - 34,
    fps,
    config: springSnappy,
    durationInFrames: 20,
  });
  const countProgress = spring({
    frame: frame - 38,
    fps,
    config: springSnappy,
    durationInFrames: 22,
  });
  const displayCount = Math.round(
    Math.min(1, Math.max(0, countProgress)) * starCount,
  );
  const copyIn = interpolate(frame, [54, 62], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });

  const windowWidth = Math.min(
    width - safeArea.paddingLeft - safeArea.paddingRight,
    scaleFont(1040, width),
  );
  const starSize = scaleFont(150, width);

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily: sansFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: windowWidth,
          borderRadius: 20,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 34px 90px ${palette.shadow}`,
          overflow: "hidden",
          opacity: windowIn,
          translate: `0 ${(1 - windowIn) * 26}px`,
        }}
      >
        <div
          style={{
            height: scaleFont(52, width),
            display: "flex",
            alignItems: "center",
            padding: `0 ${scaleFont(22, width)}px`,
            borderBottom: `1px solid ${palette.border}`,
            background: palette.header,
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8, opacity: chromeIn }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((color) => (
              <div
                key={color}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              color: palette.dim,
              fontSize: scaleFont(15, width),
              fontFamily: monoFamily,
              opacity: chromeIn,
              pointerEvents: "none",
            }}
          >
            {windowTitle}
          </div>
        </div>

        <div
          style={{
            padding: `${scaleFont(48, width)}px ${scaleFont(52, width)}px`,
          }}
        >
          <div
            style={{
              fontFamily: monoFamily,
              fontSize: scaleFont(22, width),
              color: palette.fg,
              opacity: commandIn,
              display: "flex",
              gap: scaleFont(12, width),
              whiteSpace: "pre",
            }}
          >
            <span style={{ color: accentColor }}>$</span>
            <span>{command}</span>
          </div>

          <div
            style={{
              height: 1,
              marginTop: scaleFont(28, width),
              marginBottom: scaleFont(28, width),
              background: palette.border,
              opacity: dividerIn,
              transformOrigin: "left",
              transform: `scaleX(${dividerIn})`,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleFont(32, width),
            }}
          >
            <div
              style={{
                width: starSize,
                height: starSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PathDraw
                d={STAR_PATH}
                viewBox="0 0 16 16"
                width={starSize}
                height={starSize}
                stroke={accentColor}
                strokeWidth={0.9}
                fill={accentColor}
                delayInFrames={34}
                durationInFrames={20}
                head={false}
              />
            </div>

            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  fontSize: scaleFont(96, width),
                  fontWeight: 700,
                  color: palette.fg,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayCount}
              </div>
              <div
                style={{
                  marginTop: scaleFont(10, width),
                  fontSize: scaleFont(26, width),
                  fontWeight: 500,
                  color: accentColor,
                  opacity: copyIn,
                  translate: `0 ${(1 - copyIn) * 8}px`,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: scaleFont(4, width),
                  fontSize: scaleFont(20, width),
                  color: palette.dim,
                  opacity: copyIn,
                  translate: `0 ${(1 - copyIn) * 8}px`,
                }}
              >
                {caption}
              </div>
            </div>

            {showStargazers ? (
              <>
                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    flexShrink: 0,
                    background: palette.border,
                    opacity: dividerIn,
                  }}
                />
                <StargazerFeed
                  accentColor={accentColor}
                  fg={palette.fg}
                  dim={palette.dim}
                  border={palette.border}
                  monoFamily={monoFamily}
                  width={width}
                  startFrame={40}
                  endFrame={durationInFrames - 8}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
