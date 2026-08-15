import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type SearchResult = {
  title: string;
  /** Path or source line under the title. */
  detail?: string;
  /**
   * Relevance, 0–1. Results arrive in the order given — the order of this
   * array is the order the index streamed them back — and then re-rank by
   * score, so a low-scoring first arrival visibly falls.
   */
  score: number;
};

export type SearchResultsPopulateProps = {
  /** Text typed into the field. */
  query?: string;
  results?: SearchResult[];
  /** Greyed prompt shown before the first character lands. */
  placeholder?: string;
  /** Line above the list. `{n}` is replaced with the result count. */
  countLabel?: string;
  /** Tag pinned to the top-ranked result once the list settles. */
  topLabel?: string;
  /** Typing rate for the query. */
  charsPerSecond?: number;
  /** Seconds the indeterminate bar runs between the query and the first row. */
  searchSeconds?: number;
  /**
   * Seconds the ranked list holds before the card retreats. Omit to leave it on
   * screen for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_RESULTS: SearchResult[] = [
  { title: "Slide transition between scenes", detail: "docs/transitions/slide", score: 0.64 },
  { title: "Cross-fade two compositions", detail: "docs/transitions/fade", score: 0.98 },
  { title: "Audio ducking under voiceover", detail: "docs/audio/ducking", score: 0.41 },
  { title: "Wipe with a custom mask", detail: "docs/transitions/wipe", score: 0.71 },
  { title: "Timing a transition to a beat", detail: "guides/beat-sync", score: 0.55 },
];

/** Beat plan in seconds. The query's own length decides when searching starts,
 * so everything after `type` is derived. */
const T = {
  card: 0,
  cardFor: 0.46,
  field: 0.14,
  /** First character lands. */
  type: 0.3,
  /** Gap between the bar stopping and the first row arriving. */
  beforeRows: 0.06,
  rowStagger: 0.13,
  rowFor: 0.4,
  /** Pause after the last row before the list re-ranks. */
  beforeRank: 0.24,
  rankFor: 0.55,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SearchGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="10.6" cy="10.6" r="6.4" stroke={color} strokeWidth={2} />
    <path d="M15.4 15.4L20 20" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

/**
 * A search that plays out end to end: the query types itself, an indeterminate
 * bar runs while the index works, results stream in one by one in the order
 * they came back, and then the list re-ranks so the best match rises to the top.
 *
 * The re-rank is the beat that separates this from `form-fill-sequence`, where
 * typing is the subject. Here the typing is setup — the payoff is watching a
 * fourth-place arrival climb past three rows to first.
 */
export const SearchResultsPopulate: React.FC<SearchResultsPopulateProps> = ({
  query = "transition between scenes",
  results = DEFAULT_RESULTS,
  placeholder = "Search the docs",
  countLabel = "{n} results",
  topLabel = "Best match",
  charsPerSecond = 30,
  searchSeconds = 0.34,
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

  const typeFor = Math.max(0.2, query.length / charsPerSecond);
  const typedEnd = T.type + typeFor;
  const searchEnd = typedEnd + searchSeconds;
  const rowsAt = searchEnd + T.beforeRows;
  const lastRowEnd = rowsAt + T.rowStagger * (results.length - 1) + T.rowFor;
  const rankAt = lastRowEnd + T.beforeRank;

  const typed = ease(T.type, typedEnd, EASING.editorial);
  const shown = query.slice(0, Math.round(typed * query.length));
  const searching = ease(typedEnd, typedEnd + 0.1) * (1 - ease(searchEnd, searchEnd + 0.12));
  const rank = ease(rankAt, rankAt + T.rankFor, EASING.editorial);

  const card = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const fieldIn = ease(T.field, T.field + 0.4);
  const countIn = countLabel ? ease(rowsAt - 0.1, rowsAt + 0.3) : 0;

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  // Final placement: highest score first. Ties keep arrival order, so the list
  // is stable rather than shuffling on equal relevance.
  const ranked = results
    .map((result, index) => ({ index, score: result.score }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const rankOf = results.map(
    (_, index) => ranked.findIndex((entry) => entry.index === index),
  );

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 760 * u);
  const rowH = 52 * u;
  const rowGap = 9 * u;
  const caretOn = Math.floor(frame / (fps * 0.45)) % 2 === 0;
  const typingNow = frame >= at(T.type - 0.1) && frame < at(typedEnd + 0.1);

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
          width: cardW,
          borderRadius: 20 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
            64 * u
          }px ${palette.shadow}`,
          padding: `${22 * u}px ${24 * u}px ${24 * u}px`,
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
          opacity: 1 - exit,
          transform: `translateY(${(1 - card) * 24 * u + exit * 32 * u}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 52 * u,
            display: "flex",
            alignItems: "center",
            gap: 11 * u,
            padding: `0 ${16 * u}px`,
            borderRadius: 13 * u,
            background: palette.band,
            border: `1px solid ${typed > 0 ? `${accentColor}8A` : palette.border}`,
            overflow: "hidden",
            opacity: fieldIn,
            transform: `translateY(${(1 - fieldIn) * 10 * u}px)`,
          }}
        >
          <SearchGlyph size={20 * u} color={typed > 0 ? accentColor : palette.faint} />
          <span
            style={{
              color: shown.length > 0 ? palette.fg : palette.faint,
              fontSize: 20 * u,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {shown.length > 0 ? shown : placeholder}
          </span>
          <span
            style={{
              width: 2 * u,
              height: 22 * u,
              background: accentColor,
              opacity: typingNow && caretOn ? 1 : 0,
            }}
          />
          {/* Indeterminate bar: a fixed segment sweeping the field's bottom
              edge. The position is a function of the frame, not a CSS loop. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2.5 * u,
              opacity: searching,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "38%",
                height: "100%",
                background: accentColor,
                transform: `translateX(${
                  interpolate(
                    (frame / (fps * 0.62)) % 1,
                    [0, 1],
                    [-100, 264],
                  )
                }%)`,
              }}
            />
          </div>
        </div>

        {countLabel ? (
          <div
            style={{
              marginTop: 15 * u,
              marginBottom: 9 * u,
              color: palette.dim,
              fontSize: 14 * u,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              opacity: countIn,
            }}
          >
            {countLabel.replace("{n}", String(results.length))}
          </div>
        ) : null}

        {/* The list only reserves the height it has results for. A card sized
            for the finished list up front spends the first two seconds as a
            large empty void under the search field. Each row's space opens
            just ahead of the row itself, so nothing arrives into a gap that is
            still growing and no row is ever clipped mid-arrival. */}
        <div
          style={{
            position: "relative",
            height: Math.max(
              0,
              results.reduce(
                (sum, _, index) =>
                  sum +
                  ease(
                    rowsAt + T.rowStagger * index - 0.14,
                    rowsAt + T.rowStagger * index + 0.06,
                  ),
                0,
              ) *
                (rowH + rowGap) -
                rowGap,
            ),
          }}
        >
          {results.map((result, index) => {
            const rowAt = rowsAt + T.rowStagger * index;
            const rowIn = ease(rowAt, rowAt + T.rowFor);
            // Rows travel from the slot they arrived in to the slot their score
            // earns them; nothing is re-sorted in the DOM, so React never
            // remounts a row mid-flight.
            const slot = interpolate(rank, [0, 1], [index, rankOf[index]]);
            const isTop = rankOf[index] === 0;
            const lit = isTop ? rank : 0;

            return (
              <div
                key={result.title}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: slot * (rowH + rowGap),
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * u,
                  padding: `0 ${15 * u}px`,
                  borderRadius: 12 * u,
                  background: isTop
                    ? `${accentColor}${lit > 0.5 ? "1C" : "00"}`
                    : palette.band,
                  border: `1px solid ${
                    isTop && lit > 0.5 ? `${accentColor}7A` : palette.border
                  }`,
                  opacity: rowIn,
                  transform: `translateX(${(1 - rowIn) * 26 * u}px)`,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color: palette.fg,
                      fontSize: 18 * u,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {result.title}
                  </div>
                  {result.detail ? (
                    <div
                      style={{
                        marginTop: 2 * u,
                        color: palette.faint,
                        fontSize: 14 * u,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {result.detail}
                    </div>
                  ) : null}
                </div>

                {isTop && topLabel ? (
                  <span
                    style={{
                      flexShrink: 0,
                      padding: `${5 * u}px ${10 * u}px`,
                      borderRadius: 999,
                      background: `${accentColor}24`,
                      border: `1px solid ${accentColor}70`,
                      color: accentColor,
                      fontSize: 12 * u,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      opacity: lit,
                      transform: `scale(${interpolate(lit, [0, 1], [0.85, 1])})`,
                    }}
                  >
                    {topLabel}
                  </span>
                ) : null}

                <span
                  style={{
                    flexShrink: 0,
                    color: isTop && lit > 0.5 ? accentColor : palette.dim,
                    fontSize: 17 * u,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.round(result.score * 100)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
