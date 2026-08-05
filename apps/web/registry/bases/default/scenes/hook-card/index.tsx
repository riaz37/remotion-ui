import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { markEmphasis, markerEdges } from "@/remotion/lib/text-emphasis";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

/** Characters a hook line is broken at when the caller gives no line breaks. */
const LINE_TARGET_LANDSCAPE = 22;
const LINE_TARGET_PORTRAIT = 15;

/** Width of the space between words, bridged so an underline stays unbroken. */
const WORD_SPACE = "0.26em";

export type HookCardProps = {
  /**
   * The hook line. Newlines are honoured as written; without them the hook is
   * balanced across lines so no line is left with a single orphan word.
   */
  headline: string;
  /** Small live label that counts in above the hook. */
  kicker?: string;
  /** Supporting line that settles once the hook has landed. */
  subtitle?: string;
  /**
   * Substring of `headline` carrying the promise — it takes the accent colour
   * and an underline that draws under it. Matched case-insensitively.
   */
  emphasis?: string;
  align?: "left" | "center";
  accentColor?: string;
  /** Overrides the page background. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/**
 * Breaks a hook into balanced lines at roughly `target` characters, never
 * leaving a line holding a single word. Deterministic, so the reveal masks
 * line up without measuring the DOM.
 */
function balanceLines(text: string, target: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > target) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  // Pull a word down rather than stranding the last line on its own.
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    if (!last.includes(" ")) {
      const previous = lines[lines.length - 2].split(" ");
      if (previous.length > 1) {
        lines[lines.length - 1] = `${previous.pop()} ${last}`;
        lines[lines.length - 2] = previous.join(" ");
      }
    }
  }

  return lines;
}

/**
 * The opening card of a short, staged as the delivery it stands in for: a live
 * label counts in, the hook rises line by line out of its own mask at the pace
 * it is spoken, an underline draws under the promise, and the supporting line
 * settles beneath — over a field that keeps drifting so the frame never sits
 * still on the feed.
 */
export const HookCard: React.FC<HookCardProps> = ({
  headline,
  kicker,
  subtitle,
  emphasis,
  align = "left",
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const page = backgroundColor ?? palette.page;
  const safeArea = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const frame = rawFrame * speed;

  const seconds = (value: number) => value * fps;
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  const lines = headline.includes("\n")
    ? headline.split("\n").map((line) => line.trim()).filter(Boolean)
    : balanceLines(
        headline,
        isPortrait ? LINE_TARGET_PORTRAIT : LINE_TARGET_LANDSCAPE,
      );

  // Marked across the whole hook, then sliced per line — a phrase that spans
  // the line break has to stay one emphasis, not two failed lookups.
  const marked = markEmphasis(lines.join(" "), emphasis);
  const lineWords = lines.map((line) => line.split(/\s+/).filter(Boolean).length);
  const lineOffsets = lineWords.map((_, index) =>
    lineWords.slice(0, index).reduce((total, count) => total + count, 0),
  );

  const headlineSize = scaleFont(isPortrait ? 78 : 96, width);
  const lineHeight = Math.round(headlineSize * 1.06);

  // --- Delivery plan ------------------------------------------------------
  const kickerAt = seconds(0.1);
  const lineStart = seconds(kicker ? 0.4 : 0.14);
  const lineStep = seconds(0.16);
  const lineDown = lineStart + lines.length * lineStep + seconds(0.34);
  const underlineAt = lineDown - seconds(0.1);
  const subtitleAt = underlineAt + seconds(0.22);

  const kickerIn = kicker
    ? spring({
        fps,
        frame: frame - kickerAt,
        config: { damping: 16, stiffness: 150, mass: 0.7 },
      })
    : 0;
  const dot = 0.55 + 0.45 * Math.sin((frame / fps) * Math.PI * 1.6);
  const subtitleIn = subtitle
    ? interpolate(frame, [subtitleAt, subtitleAt + seconds(0.42)], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      })
    : 0;

  // The field keeps moving under the type — a still frame reads as a slide.
  const drift = frame / fps;
  const bloomX = 24 + Math.sin(drift * 0.5) * 5;
  const bloomY = 32 + Math.cos(drift * 0.42) * 6;
  const push = interpolate(frame, [0, seconds(6)], [1, 1.045], clamp);
  const glow = interpolate(frame, [lineStart, lineDown], [0.4, 1], {
    easing: EASING.enter,
    ...clamp,
  });

  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: page,
        color: palette.fg,
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `-${scaleFont(60, width)}px`,
          background: `radial-gradient(ellipse 62% 52% at ${bloomX}% ${bloomY}%, ${accentColor}2E, transparent 66%)`,
          opacity: glow,
          transform: `scale(${push})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 130% 95% at 50% 45%, transparent 38%, rgba(0,0,0,0.66) 100%)"
              : "radial-gradient(ellipse 130% 95% at 50% 45%, transparent 52%, rgba(15,18,25,0.09) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          paddingLeft: safeArea.paddingLeft,
          paddingRight: safeArea.paddingRight,
          paddingTop: safeArea.paddingTop,
          paddingBottom: safeArea.paddingBottom,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: align === "center" ? "center" : "flex-start",
          textAlign: align,
          gap: scaleFont(26, width),
        }}
      >
        {kicker ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: scaleFont(12, width),
              padding: `${scaleFont(10, width)}px ${scaleFont(20, width)}px`,
              borderRadius: 999,
              border: `1px solid ${accentColor}4D`,
              background: `${accentColor}14`,
              color: accentColor,
              fontSize: scaleFont(24, width),
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: Math.min(1, kickerIn * 1.3),
              transform: `translateY(${interpolate(kickerIn, [0, 1], [scaleFont(18, width), 0])}px)`,
            }}
          >
            <span
              style={{
                width: scaleFont(10, width),
                height: scaleFont(10, width),
                borderRadius: "50%",
                background: accentColor,
                opacity: dot,
              }}
            />
            {kicker}
          </div>
        ) : null}

        <h1
          style={{
            margin: 0,
            fontSize: headlineSize,
            lineHeight: `${lineHeight}px`,
            letterSpacing: "-0.034em",
            fontWeight: 800,
            width: "100%",
          }}
        >
          {lines.map((line, lineIndex) => {
            // Each line rises out of its own mask, so the hook lands in the
            // cadence it is spoken rather than appearing already finished.
            const rise = spring({
              fps,
              frame: frame - (lineStart + lineIndex * lineStep),
              config: { damping: 18, stiffness: 130, mass: 0.75 },
            });
            const words = marked.slice(
              lineOffsets[lineIndex],
              lineOffsets[lineIndex] + lineWords[lineIndex],
            );

            return (
              <div
                key={`${line}-${lineIndex}`}
                style={{
                  height: lineHeight,
                  overflow: "hidden",
                  display: "flex",
                  justifyContent:
                    align === "center" ? "center" : "flex-start",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    whiteSpace: "pre",
                    paddingBottom: scaleFont(4, width),
                    transform: `translateY(${interpolate(rise, [0, 1], [lineHeight, 0])}px)`,
                  }}
                >
                  {words.map((word, wordIndex) => (
                    <span key={`${word.text}-${wordIndex}`}>
                      {wordIndex > 0 ? " " : ""}
                      <span
                        style={{
                          position: "relative",
                          display: "inline-block",
                          color: word.marked ? accentColor : palette.fg,
                        }}
                      >
                        {word.text}
                        {word.marked ? (
                          <span
                            style={{
                              position: "absolute",
                              ...markerEdges(
                                words,
                                wordIndex,
                                WORD_SPACE,
                                scaleFont(2, width),
                                999,
                              ),
                              top: "100%",
                              marginTop: scaleFont(-6, width),
                              height: scaleFont(7, width),
                              background: accentColor,
                              opacity: 0.92,
                              // Draws under the promise once the line is down.
                              transform: `scaleX(${interpolate(
                                frame,
                                [
                                  underlineAt + word.order * seconds(0.07),
                                  underlineAt +
                                    word.order * seconds(0.07) +
                                    seconds(0.34),
                                ],
                                [0, 1],
                                { easing: EASING.enter, ...clamp },
                              )})`,
                              transformOrigin: "left center",
                            }}
                          />
                        ) : null}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </h1>

        {subtitle ? (
          <p
            style={{
              margin: 0,
              color: palette.dim,
              fontSize: scaleFont(34, width),
              lineHeight: 1.3,
              fontWeight: 500,
              maxWidth: isPortrait ? "100%" : "72%",
              opacity: subtitleIn,
              transform: `translateY(${(1 - subtitleIn) * scaleFont(18, width)}px)`,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
