import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type HeatmapGridProps = {
  /** Row-major intensities. Rows may be ragged; short rows are padded empty. */
  cells: number[][];
  /** Highest value in the ramp. Defaults to the largest cell present. */
  maxValue?: number;
  /** Cell edge length, in pixels. */
  cellSize?: number;
  /** Space between cells. */
  gap?: number;
  cornerRadius?: number;
  /** Colour at full intensity. Empty cells sit at `emptyColor`. */
  color?: string;
  emptyColor?: string;
  /** Labels down the left gutter, one per row. */
  rowLabels?: string[];
  /** Labels along the top, one per column. Sparse arrays are fine. */
  columnLabels?: string[];
  labelColor?: string;
  /** "Less → more" ramp under the grid. */
  showLegend?: boolean;
  /** Length of one cell's fill. */
  durationInFrames?: number;
  /** Frames added per column as the wave crosses the grid. */
  columnStaggerInFrames?: number;
  /** Frames added per row. Keep below the column stagger for a diagonal wave. */
  rowStaggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once filled. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A contribution-graph grid that fills in on a diagonal wave.
 *
 * Intensity is carried by colour and by scale at once. Colour alone is hard to
 * read at cell size on a dark stage, and the small size difference is what lets
 * a busy column register as busy in peripheral vision.
 *
 * Cells are staggered by column plus row rather than by index, so the fill
 * sweeps as a diagonal front — an index stagger would snake back to the left
 * edge on every new row.
 */
export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  cells,
  maxValue,
  cellSize = 34,
  gap = 8,
  cornerRadius = 8,
  color = "#e8b86d",
  emptyColor = "rgba(250,250,250,0.07)",
  rowLabels,
  columnLabels,
  labelColor = "rgba(250,250,250,0.5)",
  showLegend = true,
  durationInFrames = 14,
  columnStaggerInFrames = 3,
  rowStaggerInFrames = 1.5,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const columnCount = cells.reduce((widest, row) => Math.max(widest, row.length), 0);
  const peak =
    maxValue ??
    cells.reduce(
      (highest, row) => row.reduce((rowMax, value) => Math.max(rowMax, value), highest),
      0,
    );

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const pitch = cellSize + gap;
  const labelSize = Math.max(11, cellSize * 0.42);
  const gutter = rowLabels ? cellSize * 2.6 : 0;

  return (
    <div style={{ display: "inline-grid", gap: cellSize * 0.5 }}>
      {columnLabels ? (
        <div style={{ display: "flex", marginLeft: gutter }}>
          {Array.from({ length: columnCount }, (_, column) => (
            <span
              key={column}
              style={{
                width: pitch,
                color: labelColor,
                fontSize: labelSize,
                fontWeight: 600,
              }}
            >
              {columnLabels[column] ?? ""}
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: "grid", gap }}>
        {cells.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{ display: "flex", alignItems: "center", gap }}
          >
            {rowLabels ? (
              <span
                style={{
                  width: gutter - gap,
                  color: labelColor,
                  fontSize: labelSize,
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {rowLabels[rowIndex] ?? ""}
              </span>
            ) : null}

            {Array.from({ length: columnCount }, (_, column) => {
              const value = row[column] ?? 0;
              const intensity = peak > 0 ? clamp01(value / peak) : 0;
              const start =
                delayInFrames +
                column * columnStaggerInFrames +
                rowIndex * rowStaggerInFrames;
              const progress = interpolate(
                frame,
                [start, start + durationInFrames],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASING.enter,
                },
              );

              // The exit drains along the same diagonal, one grid-width later,
              // so the wave leaves the way it arrived.
              const drain = clamp01(
                (exit - (column / Math.max(1, columnCount)) * 0.35) / 0.65,
              );
              const shown = clamp01(progress - drain);

              return (
                <div
                  key={column}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: cornerRadius,
                    background:
                      intensity === 0
                        ? emptyColor
                        : interpolateColors(
                            intensity * shown,
                            [0, 1],
                            [emptyColor, color],
                          ),
                    scale: `${0.55 + 0.45 * shown + intensity * shown * 0.06}`,
                    opacity: 0.25 + 0.75 * shown,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {showLegend ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: gap,
            marginLeft: gutter,
            color: labelColor,
            fontSize: labelSize,
            fontWeight: 600,
            opacity: 1 - clamp01(exit / 0.7),
          }}
        >
          <span>Less</span>
          {[0.12, 0.36, 0.6, 0.84, 1].map((step) => (
            <span
              key={step}
              style={{
                width: cellSize * 0.66,
                height: cellSize * 0.66,
                borderRadius: cornerRadius * 0.66,
                background: interpolateColors(step, [0, 1], [emptyColor, color]),
              }}
            />
          ))}
          <span>More</span>
        </div>
      ) : null}
    </div>
  );
};
