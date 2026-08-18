import { interpolate, useCurrentFrame } from "remotion";
import { formatCompactNumber } from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ComparisonRowDatum = {
  label: string;
  /** Baseline value — the muted bar. */
  before: number;
  /** New value — the coloured bar. */
  after: number;
  /** Overrides the computed percentage change. */
  delta?: string;
};

export type ComparisonBarsProps = {
  rows: ComparisonRowDatum[];
  width?: number;
  /** Height of one pair of bars, both bars and their gap included. */
  rowHeight?: number;
  /** Space between rows. */
  gap?: number;
  /** Width reserved for the row labels. */
  labelWidth?: number;
  beforeColor?: string;
  afterColor?: string;
  /** Colour of a delta chip when the change is a fall. */
  downColor?: string;
  /** Ink for the figure printed inside the coloured bar. */
  barInkColor?: string;
  labelColor?: string;
  /** Names for the two series, shown as a legend above the rows. */
  seriesLabels?: [string, string];
  /** Percentage-change chip at the end of the second bar. */
  showDelta?: boolean;
  valueFormatter?: (value: number) => string;
  /** Length of one bar's growth. */
  durationInFrames?: number;
  /** Frames between one row and the next. */
  staggerInFrames?: number;
  /** Frames the second bar trails the first by. */
  pairOffsetInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once grown. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Before-and-after pairs with the change called out.
 *
 * Both bars share one scale across every row, so the pairs are comparable to
 * each other and not only within themselves — per-row scaling is what makes a
 * small category look like it beat a large one.
 *
 * The second bar trails the first by `pairOffsetInFrames`. The gap is what
 * makes the pair read as *a change* rather than as two unrelated bars that
 * happen to be adjacent, and it is short enough that both are still growing at
 * once.
 */
export const ComparisonBars: React.FC<ComparisonBarsProps> = ({
  rows,
  width = 820,
  rowHeight = 74,
  gap = 26,
  labelWidth = 190,
  beforeColor = "rgba(250,250,250,0.22)",
  afterColor = "#e8b86d",
  downColor = "#f472b6",
  barInkColor = "#0b0b10",
  labelColor = "rgba(250,250,250,0.55)",
  seriesLabels,
  showDelta = true,
  valueFormatter = (value: number) => formatCompactNumber(value),
  durationInFrames = 30,
  staggerInFrames = 12,
  pairOffsetInFrames = 6,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const peak =
    rows.reduce(
      (highest, row) => Math.max(highest, row.before, row.after),
      0,
    ) || 1;
  const barWidth = width - labelWidth;
  const barHeight = (rowHeight - 8) / 2;
  const chipSize = barHeight * 0.5;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const grow = (start: number) =>
    interpolate(frame, [start, start + durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    });

  return (
    <div style={{ width, display: "grid", gap }}>
      {seriesLabels ? (
        <div
          style={{
            display: "flex",
            gap: gap,
            marginLeft: labelWidth,
            color: labelColor,
            fontSize: barHeight * 0.46,
            fontWeight: 600,
            opacity: 1 - clamp01(exit / 0.7),
          }}
        >
          {[beforeColor, afterColor].map((swatch, index) => (
            <span
              key={swatch}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  width: barHeight * 0.42,
                  height: barHeight * 0.42,
                  borderRadius: 4,
                  background: swatch,
                }}
              />
              {seriesLabels[index]}
            </span>
          ))}
        </div>
      ) : null}

      {rows.map((row, index) => {
        const start = delayInFrames + index * staggerInFrames;
        const beforeProgress = grow(start);
        const afterProgress = grow(start + pairOffsetInFrames);
        // Rows leave in the order they arrived.
        const drain = clamp01((exit - index * 0.05) / 0.7);

        const change =
          row.before === 0 ? 0 : ((row.after - row.before) / row.before) * 100;
        const delta =
          row.delta ?? `${change >= 0 ? "+" : "−"}${Math.abs(Math.round(change))}%`;

        return (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              opacity: 1 - drain,
              translate: `0 ${drain * rowHeight * 0.25}px`,
            }}
          >
            <span
              style={{
                width: labelWidth,
                paddingRight: 20,
                boxSizing: "border-box",
                color: labelColor,
                fontSize: barHeight * 0.5,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {row.label}
            </span>

            <div style={{ display: "grid", gap: 8, flex: 1 }}>
              <div
                style={{
                  height: barHeight,
                  width: (row.before / peak) * barWidth * beforeProgress,
                  background: beforeColor,
                  borderRadius: barHeight * 0.28,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    height: barHeight,
                    width: (row.after / peak) * barWidth * afterProgress,
                    background: afterColor,
                    borderRadius: barHeight * 0.28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: barHeight * 0.32,
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      color: barInkColor,
                      fontSize: barHeight * 0.46,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      // The figure waits until the bar is wide enough to hold
                      // it, rather than spilling past its own left edge.
                      opacity: clamp01((afterProgress - 0.55) / 0.25),
                    }}
                  >
                    {valueFormatter(row.after)}
                  </span>
                </div>

                {showDelta ? (
                  <span
                    style={{
                      color: change >= 0 ? afterColor : downColor,
                      fontSize: chipSize,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                      // The callout is the conclusion of the pair, so it lands
                      // only once the second bar has stopped moving.
                      opacity: clamp01((afterProgress - 0.86) / 0.14),
                      translate: `${(1 - clamp01((afterProgress - 0.86) / 0.14)) * -12}px`,
                    }}
                  >
                    {delta}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
