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

/** `true` ticks, `false` crosses, a string prints as-is. */
export type MatrixCell = boolean | string;

export type MatrixRow = {
  label: string;
  /** One entry per column, in column order. */
  cells: MatrixCell[];
};

export type ComparisonTableProps = {
  /** Column headings. The first table column is the feature label, unnamed. */
  columns?: string[];
  rows?: MatrixRow[];
  /** Heading above the table. Omit to drop it. */
  title?: string;
  /** Index into `columns` that stays lit throughout. Pass -1 for none. */
  highlightColumn?: number;
  /** Chip pinned above the highlighted column. */
  highlightLabel?: string;
  /** Second the first row wipes in. */
  startAtSeconds?: number;
  /** Seconds between rows. */
  rowStaggerSeconds?: number;
  /**
   * Seconds the finished table holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_COLUMNS = ["Free", "Studio", "Scale"];

const DEFAULT_ROWS: MatrixRow[] = [
  { label: "Render minutes", cells: ["60", "2,000", "Unlimited"] },
  { label: "1080p exports", cells: [true, true, true] },
  { label: "4K exports", cells: [false, true, true] },
  { label: "Team seats", cells: ["1", "9", "Unlimited"] },
  { label: "Render API", cells: [false, true, true] },
  { label: "Priority queue", cells: [false, false, true] },
];

/** Beat plan in seconds. Row times come from the props. */
const T = {
  card: 0,
  cardFor: 0.46,
  head: 0.2,
  headFor: 0.4,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const Tick: React.FC<{ color: string; size: number; progress: number }> = ({
  color,
  size,
  progress,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5 L10 17.5 L19 7"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - progress}
    />
  </svg>
);

const Cross: React.FC<{ color: string; size: number; progress: number }> = ({
  color,
  size,
  progress,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - progress}
    />
  </svg>
);

/**
 * A feature matrix that fills in the way you would read it: one row at a time,
 * label first, then each column's verdict a fraction behind the last so the eye
 * tracks left to right instead of taking the whole row as a block.
 *
 * Ticks and crosses draw their own strokes rather than fading, which keeps them
 * legible at the small sizes a matrix forces — a fading glyph spends most of its
 * entrance as grey mush, a drawing one is sharp from the first frame.
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  title = "What you get",
  highlightColumn = 1,
  highlightLabel = "Most picked",
  startAtSeconds = 0.5,
  rowStaggerSeconds = 0.26,
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
  // D1. Authored against a 1280x720 reference, u resolves to 0.75 on the 960
  // docs stage, so a 15-unit label landed at 11px — 3.6px once the contact
  // sheet reduces the stage 3.1x. The reference is the whole design's scale, so
  // shrinking it grows the layout into the margin it was leaving empty and
  // lifts every tier of type with it, instead of hand-tuning font sizes against
  // a layout that stays too small.
  const u = portrait
    ? Math.min(width / 496, height / 896)
    : Math.min(width / 1024, height / 576);

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 880 * u);
  const pad = 24 * u;
  const labelW = (cardW - pad * 2) * 0.36;
  const colW = ((cardW - pad * 2) - labelW) / columns.length;
  const rowH = 46 * u;
  const headH = 44 * u;

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
          padding: pad,
          position: "relative",
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
          opacity: 1 - exit,
          translate: `0 ${(1 - cardIn) * 22 * u + exit * 30 * u}px`,
        }}
      >
        {/* The favoured column is a lit band behind the grid, not a per-cell
            background — one shape means the rows can never disagree about where
            its edges are. */}
        {highlightColumn >= 0 && highlightColumn < columns.length ? (
          <div
            style={{
              position: "absolute",
              left: pad + labelW + highlightColumn * colW,
              top: pad + (title ? 44 * u : 0),
              width: colW,
              height: headH + rows.length * rowH,
              borderRadius: 12 * u,
              background: `${accentColor}12`,
              border: `1px solid ${accentColor}3A`,
              opacity: headIn,
            }}
          />
        ) : null}

        {title ? (
          <div
            style={{
              height: 44 * u,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: palette.fg,
              fontSize: 26 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
            }}
          >
            <span>{title}</span>
            {highlightLabel && highlightColumn >= 0 ? (
              <span
                style={{
                  padding: `${4 * u}px ${10 * u}px`,
                  borderRadius: 999,
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}66`,
                  color: accentColor,
                  fontSize: 14.5 * u,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {highlightLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", height: headH, alignItems: "flex-end" }}>
            <div style={{ width: labelW }} />
            {columns.map((column, columnIndex) => (
              <div
                key={column}
                style={{
                  width: colW,
                  textAlign: "center",
                  paddingBottom: 10 * u,
                  color: columnIndex === highlightColumn ? accentColor : palette.dim,
                  fontSize: 15 * u,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  opacity: headIn,
                  translate: `0 ${(1 - headIn) * 8 * u}px`,
                }}
              >
                {column}
              </div>
            ))}
          </div>

          {rows.map((row, rowIndex) => {
            const rowAt = startAtSeconds + rowIndex * rowStaggerSeconds;
            const rowIn = ease(rowAt, rowAt + 0.4);
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: rowH,
                  borderTop: `1px solid ${palette.border}`,
                  opacity: rowIn,
                }}
              >
                <div
                  style={{
                    width: labelW,
                    color: palette.fg,
                    fontSize: 16.5 * u,
                    fontWeight: 500,
                    translate: `${(1 - rowIn) * -12 * u}px`,
                  }}
                >
                  {row.label}
                </div>
                {row.cells.map((cell, cellIndex) => {
                  // Cells trail their label so the row resolves left to right.
                  const cellAt = rowAt + 0.09 + cellIndex * 0.07;
                  const cellIn = ease(cellAt, cellAt + 0.3, EASING.editorial);
                  const lit = cellIndex === highlightColumn;
                  return (
                    <div
                      key={`${row.label}-${cellIndex}`}
                      style={{
                        width: colW,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: cellIn,
                      }}
                    >
                      {typeof cell === "string" ? (
                        <span
                          style={{
                            color: lit ? accentColor : palette.fg,
                            fontSize: 16 * u,
                            fontWeight: lit ? 700 : 600,
                            fontVariantNumeric: "tabular-nums",
                            scale: `${0.92 + cellIn * 0.08}`,
                          }}
                        >
                          {cell}
                        </span>
                      ) : cell ? (
                        <Tick
                          color={lit ? accentColor : "#9BD4A0"}
                          size={22 * u}
                          progress={cellIn}
                        />
                      ) : (
                        <Cross color={palette.faint} size={22 * u} progress={cellIn} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
