import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type TitleCardProps = {
  /** Headline. Newlines are honoured; otherwise lines are balanced. */
  title: string;
  subtitle?: string;
  /** Chip above the headline — chapter, series, release. */
  eyebrow?: string;
  /** Small line under the subtitle — date, author, run time. */
  meta?: string;
  /** Characters per line the headline is balanced to. */
  charsPerLine?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds after which the scene leaves. Omit to hold — correct inside a
   * `TransitionSeries`, where the transition covers the tail, and wrong on
   * its own, where the card stands still for the rest of the clip.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  eyebrow: 0.12,
  title: 0.28,
  /** Added per headline line. */
  lineStagger: 0.09,
  subtitle: 0.72,
  meta: 0.9,
  /**
   * Sweep across the headline once it is standing. It has to finish inside the
   * shortest window a host gives this scene — `browser-flow` runs it as a
   * 48-frame bumper at `speed={1.4}`, i.e. 2.24s of scene time — so the end of
   * the sweep is what caps `sweepFor`, not the preview.
   */
  sweep: 0.95,
  sweepFor: 1.25,
  exitFor: 0.4,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Greedy wrap that keeps the last line from being a runt. */
function balanceLines(text: string, target: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > target && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

/**
 * The opening card as a title standing up rather than a block fading in: each
 * line rises out of its own mask in turn, a single sweep of light crosses the
 * headline once it is standing, and the whole block holds under a slow push.
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  eyebrow,
  meta,
  charsPerLine = 22,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });
  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  const lines = title.includes("\n")
    ? title.split("\n")
    : balanceLines(title, charsPerLine);
  const titleSize = 80 * u;

  const eyebrowIn = eyebrow ? ease(T.eyebrow, T.eyebrow + 0.45) : 0;
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.5) : 0;
  const metaIn = meta ? ease(T.meta, T.meta + 0.5) : 0;
  const sweep = ease(T.sweep, T.sweep + T.sweepFor, EASING.editorial);
  /** Ramp the glow on and off. A boolean gate cuts it in and out. */
  const sweepOpacity = interpolate(sweep, [0, 0.08, 0.92, 1], [0, 1, 1, 0], clamp);
  /** Slow push under the whole card, so a long hold never sits dead still. */
  const push = ease(0, 7, EASING.editorial);

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 62% 48% at 50% 46%, ${accentColor}1F, transparent 72%)`,
          scale: interpolate(push, [0, 1], [1, 1.12], {
            output: "perceptual-scale",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.5) 100%)"
              : "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(15,18,25,0.08) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: stage.w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18 * u,
          textAlign: "center",
          scale: interpolate(push, [0, 1], [1, 1.02], {
            output: "perceptual-scale",
          }),
          opacity: 1 - exit,
          translate: `0 ${exit * -26 * u}px`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              padding: `${8 * u}px ${16 * u}px`,
              borderRadius: 999,
              border: `1px solid ${accentColor}55`,
              background: `${accentColor}12`,
              color: accentColor,
              fontSize: 20 * u,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: eyebrowIn,
              translate: `0 ${(1 - eyebrowIn) * 12 * u}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <h1
          style={{
            margin: 0,
            position: "relative",
            color: palette.fg,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
          }}
        >
          {lines.map((line, index) => {
            const lineIn = ease(
              T.title + index * T.lineStagger,
              T.title + index * T.lineStagger + 0.55,
            );
            return (
              // Each line owns a mask, so it rises out of the line above it.
              <span
                key={`${line}-${index}`}
                style={{
                  display: "block",
                  overflow: "hidden",
                  paddingBottom: "0.04em",
                }}
              >
                <span
                  style={{
                    display: "block",
                    translate: `0 ${(1 - lineIn) * 100}%`,
                  }}
                >
                  {line}
                </span>
              </span>
            );
          })}

          {/* One sweep of light across the standing headline. A band moved by
              transform, not a shifted background-position — the latter renders
              as a hard-edged block once the gradient is scaled up. */}
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              // Taller than the type: clipping the glow at the text box would
              // draw its own straight edges across the headline.
              top: "-45%",
              bottom: "-45%",
              overflow: "hidden",
              pointerEvents: "none",
              opacity: sweepOpacity,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "42%",
                // A soft blob, not a hard-edged band: a linear gradient in a
                // box shows its own corners once it is blended additively.
                background: `radial-gradient(ellipse 50% 42% at 50% 50%, ${accentColor}66, transparent 72%)`,
                filter: `blur(${10 * u}px)`,
                mixBlendMode: "plus-lighter",
                translate: `${interpolate(sweep, [0, 1], [-110, 340])}% 0`,
              }}
            />
          </span>
        </h1>

        {subtitle ? (
          <p
            style={{
              margin: 0,
              maxWidth: stage.w * 0.76,
              color: palette.dim,
              fontSize: 32 * u,
              fontWeight: 500,
              lineHeight: 1.35,
              opacity: subtitleIn,
              translate: `0 ${(1 - subtitleIn) * 14 * u}px`,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        {meta ? (
          <div
            style={{
              marginTop: 4 * u,
              color: palette.faint,
              fontSize: 20 * u,
              letterSpacing: "0.06em",
              opacity: metaIn,
            }}
          >
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
};
