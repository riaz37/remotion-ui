import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { markEmphasis, markerEdges } from "@/remotion/lib/text-emphasis";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type QuoteCardProps = {
  quote: string;
  /**
   * Phrase inside the quote swept with a marker, word by word. Matched
   * case-insensitively over the whole quote, so it may span a line break.
   */
  emphasis?: string;
  author?: string;
  /** Second attribution line — role, company, handle. */
  role?: string;
  /** Initials in the attribution disc. Falls back to the author's initials. */
  initials?: string;
  /** Characters per line the quote is balanced to. */
  charsPerLine?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  mark: 0,
  quote: 0.3,
  lineStagger: 0.11,
  /** Marker starts once the quote is standing. */
  sweep: 0.34,
  sweepStagger: 0.11,
  attribution: 0.5,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const WORD_GAP = "0.28em";

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
 * A pull quote read aloud rather than pasted in: the quote mark draws, the
 * quote rises line by line out of its own masks, a marker sweeps the phrase the
 * speaker leant on, and the attribution arrives last.
 */
export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  emphasis,
  author,
  role,
  initials,
  charsPerLine = 30,
  backgroundColor,
  accentColor = "#F472B6",
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

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  // Emphasis is matched over the whole quote and then sliced per line — a
  // per-line match silently drops any phrase that spans the break.
  const words = markEmphasis(quote, emphasis);
  const lines = balanceLines(quote, charsPerLine);
  let cursor = 0;
  const lineWords = lines.map((line) => {
    const length = line.split(/\s+/).filter(Boolean).length;
    const slice = words.slice(cursor, cursor + length);
    cursor += length;
    return slice;
  });

  const markDraw = ease(T.mark, T.mark + 0.6, EASING.editorial);
  const attributionIn = ease(T.attribution, T.attribution + 0.5);
  const quoteSize = 52 * u;
  const badge =
    initials ??
    (author
      ? author
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "");

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
          background: `radial-gradient(ellipse 60% 50% at 50% 42%, ${accentColor}1A, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          width: Math.min(stage.w, 900 * u),
          display: "flex",
          flexDirection: "column",
          gap: 22 * u,
        }}
      >
        {/* Quote mark, drawn rather than typed */}
        <svg
          width={64 * u}
          height={52 * u}
          viewBox="0 0 64 52"
          fill="none"
          style={{ opacity: markDraw }}
        >
          <path
            d="M24 4C12 10 4 21 4 34c0 8 5 14 12 14s12-5 12-12-5-12-11-12c-1 0-2 0-3 .3C16 18 20 11 27 7l-3-3ZM58 4C46 10 38 21 38 34c0 8 5 14 12 14s12-5 12-12-5-12-11-12c-1 0-2 0-3 .3C50 18 54 11 61 7l-3-3Z"
            fill={accentColor}
            fillOpacity={0.9}
            style={{
              transform: `translateY(${(1 - markDraw) * 14 * u}px)`,
            }}
          />
        </svg>

        <div
          style={{
            color: palette.fg,
            fontSize: quoteSize,
            fontWeight: 600,
            lineHeight: 1.28,
            letterSpacing: "-0.02em",
          }}
        >
          {lineWords.map((line, lineIndex) => {
            const lineIn = ease(
              T.quote + lineIndex * T.lineStagger,
              T.quote + lineIndex * T.lineStagger + 0.55,
            );
            return (
              <span
                key={`line-${lineIndex}`}
                style={{
                  display: "block",
                  overflow: "hidden",
                  paddingBottom: "0.06em",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: `0 ${WORD_GAP}`,
                    transform: `translateY(${(1 - lineIn) * 100}%)`,
                  }}
                >
                  {line.map((word, wordIndex) => {
                    if (!word.marked) {
                      return (
                        <span key={`w-${lineIndex}-${wordIndex}`}>
                          {word.text}
                        </span>
                      );
                    }
                    const sweep = ease(
                      T.sweep + word.order * T.sweepStagger,
                      T.sweep + word.order * T.sweepStagger + 0.34,
                      EASING.editorial,
                    );
                    const edges = markerEdges(
                      line,
                      wordIndex,
                      WORD_GAP,
                      6 * u,
                      6 * u,
                    );
                    return (
                      <span
                        key={`w-${lineIndex}-${wordIndex}`}
                        style={{ position: "relative", whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "0.1em",
                            bottom: "0.06em",
                            left: edges.left,
                            right: edges.right,
                            background: `${accentColor}44`,
                            borderTopLeftRadius: edges.borderTopLeftRadius,
                            borderBottomLeftRadius: edges.borderBottomLeftRadius,
                            borderTopRightRadius: edges.borderTopRightRadius,
                            borderBottomRightRadius:
                              edges.borderBottomRightRadius,
                            transformOrigin: "left center",
                            transform: `scaleX(${sweep})`,
                          }}
                        />
                        <span style={{ position: "relative" }}>
                          {word.text}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </span>
            );
          })}
        </div>

        {author ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              opacity: attributionIn,
              transform: `translateX(${(1 - attributionIn) * -16 * u}px)`,
            }}
          >
            {badge ? (
              <div
                style={{
                  width: 52 * u,
                  height: 52 * u,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}55`,
                  color: accentColor,
                  fontSize: 20 * u,
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            ) : null}
            <div>
              <div
                style={{
                  color: palette.fg,
                  fontSize: 25 * u,
                  fontWeight: 600,
                }}
              >
                {author}
              </div>
              {role ? (
                <div
                  style={{
                    marginTop: 2 * u,
                    color: palette.faint,
                    fontSize: 20 * u,
                  }}
                >
                  {role}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
