import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type GanttTask = {
  label: string;
  /** Start position on the timeline, in column units. */
  start: number;
  /** End position, exclusive. Must be greater than `start`. */
  end: number;
  /** Share of the bar already done, 0–1. Drawn as a solid inner fill. */
  progress?: number;
  color?: string;
  /** Draws the bar as a milestone diamond at `start`, ignoring `end`. */
  milestone?: boolean;
};

export type GanttTimelineProps = {
  tasks: GanttTask[];
  /** Column headings, e.g. weeks or months. Their count sets the span. */
  columns: string[];
  width?: number;
  /** Height of one task row. */
  rowHeight?: number;
  /** Space between rows. */
  gap?: number;
  /** Width reserved for the task names. */
  labelWidth?: number;
  colors?: string[];
  gridColor?: string;
  labelColor?: string;
  /** Vertical rule at this column position. Omit for none. */
  markerAt?: number;
  markerColor?: string;
  markerLabel?: string;
  /** Length of one bar's wipe. */
  durationInFrames?: number;
  /** Frames between one row and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once drawn. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5", "#f59e0b"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A schedule: task bars laid across a shared column grid.
 *
 * Bars wipe out from their own start edge, never from the left margin, so the
 * animation says *when the task begins* as well as how long it runs. Rows
 * stagger downward, which is the order a schedule is read.
 *
 * `start` and `end` are in column units, not pixels, so a task can be moved by
 * editing one number and every rule, marker and bar stays in register.
 */
export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  tasks,
  columns,
  width = 900,
  rowHeight = 48,
  gap = 12,
  labelWidth = 240,
  colors = DEFAULT_COLORS,
  gridColor = "rgba(250,250,250,0.09)",
  labelColor = "rgba(250,250,250,0.58)",
  markerAt,
  markerColor = "#fafafa",
  markerLabel,
  durationInFrames = 24,
  staggerInFrames = 8,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const span = Math.max(1, columns.length);
  const trackWidth = width - labelWidth;
  const columnWidth = trackWidth / span;
  const headerHeight = rowHeight * 0.9;
  const height = headerHeight + tasks.length * (rowHeight + gap);
  const labelSize = Math.max(11, rowHeight * 0.3);

  const x = (position: number) => labelWidth + position * columnWidth;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const chromeOpacity =
    interpolate(frame, [delayInFrames, delayInFrames + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    }) * (1 - clamp01(exit / 0.7));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g opacity={chromeOpacity}>
        {columns.map((column, index) => (
          <g key={column}>
            <line
              x1={x(index)}
              y1={headerHeight * 0.55}
              x2={x(index)}
              y2={height}
              stroke={gridColor}
              strokeWidth={1}
            />
            <text
              x={x(index) + columnWidth / 2}
              y={headerHeight * 0.3}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {column}
            </text>
          </g>
        ))}
        <line
          x1={x(span)}
          y1={headerHeight * 0.55}
          x2={x(span)}
          y2={height}
          stroke={gridColor}
          strokeWidth={1}
        />
      </g>

      {markerAt !== undefined ? (
        <g opacity={chromeOpacity}>
          <line
            x1={x(markerAt)}
            y1={headerHeight * 0.55}
            x2={x(markerAt)}
            y2={height}
            stroke={markerColor}
            strokeWidth={2}
            strokeDasharray="6 6"
            opacity={0.5}
          />
          {markerLabel ? (
            <g>
              {/* The chip is what keeps the marker readable: the rule can land
                  anywhere, including straight through a column heading. */}
              <rect
                x={x(markerAt) - markerLabel.length * labelSize * 0.29}
                y={headerHeight * 0.3 - labelSize * 0.72}
                width={markerLabel.length * labelSize * 0.58}
                height={labelSize * 1.44}
                rx={labelSize * 0.4}
                fill={markerColor}
              />
              <text
                x={x(markerAt)}
                y={headerHeight * 0.3}
                fill="#0b0b10"
                fontSize={labelSize * 0.86}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {markerLabel}
              </text>
            </g>
          ) : null}
        </g>
      ) : null}

      {tasks.map((task, index) => {
        const start = delayInFrames + 6 + index * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );
        // Rows leave top-down, in the order they were drawn.
        const drain = clamp01((exit - index * 0.05) / 0.7);
        const shown = clamp01(progress) * (1 - drain);
        if (shown <= 0) return null;

        const top = headerHeight + index * (rowHeight + gap);
        const centreY = top + rowHeight / 2;
        const colour = task.color ?? colors[index % colors.length];
        const barLeft = x(task.start);
        const barWidth = Math.max(0, x(task.end) - barLeft) * shown;

        return (
          <g key={task.label}>
            <text
              x={labelWidth - labelSize}
              y={centreY}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={600}
              textAnchor="end"
              dominantBaseline="central"
              opacity={clamp01(progress * 1.6) * (1 - drain)}
            >
              {task.label}
            </text>

            {task.milestone ? (
              <g
                transform={`translate(${barLeft} ${centreY}) rotate(45) scale(${shown})`}
              >
                <rect
                  x={-rowHeight * 0.26}
                  y={-rowHeight * 0.26}
                  width={rowHeight * 0.52}
                  height={rowHeight * 0.52}
                  rx={rowHeight * 0.08}
                  fill={colour}
                />
              </g>
            ) : (
              <g>
                <rect
                  x={barLeft}
                  y={top + rowHeight * 0.18}
                  width={barWidth}
                  height={rowHeight * 0.64}
                  rx={rowHeight * 0.2}
                  fill={colour}
                  opacity={task.progress === undefined ? 0.92 : 0.34}
                />
                {task.progress !== undefined ? (
                  <rect
                    x={barLeft}
                    y={top + rowHeight * 0.18}
                    // The done portion fills only after the bar has finished
                    // wiping, so the two reads never compete.
                    width={
                      barWidth *
                      clamp01(task.progress) *
                      clamp01((progress - 0.75) / 0.25)
                    }
                    height={rowHeight * 0.64}
                    rx={rowHeight * 0.2}
                    fill={colour}
                  />
                ) : null}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
