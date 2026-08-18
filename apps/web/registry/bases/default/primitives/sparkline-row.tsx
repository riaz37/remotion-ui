import { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  buildAreaPath,
  buildSmoothPath,
  formatCompactNumber,
  getChartDomain,
  readDelta,
  scaleValue,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";
import { getPathDrawStyles } from "@/remotion/lib/path-utils";

export type SparklineSeries = {
  label: string;
  /** Raw series, oldest first. Two points is the minimum that draws. */
  values: number[];
  /** Headline figure. Defaults to the last value, compact-formatted. */
  value?: string;
  /** Change annotation, e.g. `"+18%"`. Colour follows the sign. */
  delta?: string;
  color?: string;
};

export type SparklineRowProps = {
  rows: SparklineSeries[];
  /** Overall width of the stack, in pixels. */
  width?: number;
  /** Height of one row. The spark is drawn into most of it. */
  rowHeight?: number;
  /** Width of the spark itself; the rest goes to label and value. */
  sparkWidth?: number;
  color?: string;
  upColor?: string;
  downColor?: string;
  inkColor?: string;
  labelColor?: string;
  /** Gradient wash under each line. */
  showArea?: boolean;
  /** Length of one row's draw. */
  durationInFrames?: number;
  /** Frames between the start of one row and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once drawn. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A stack of compact trend lines, each drawing itself on in turn.
 *
 * Every row scales to its own domain rather than a shared one. A sparkline is
 * read for shape, not level: putting a metric that moves between 4 and 6 on the
 * same axis as one in the thousands would flatten it into a straight line.
 *
 * The rows are laid out with CSS and only the spark is SVG, so a row can hold
 * real type — tabular figures, a coloured delta — without fighting SVG text
 * metrics.
 */
export const SparklineRow: React.FC<SparklineRowProps> = ({
  rows,
  width = 720,
  rowHeight = 96,
  sparkWidth = 260,
  color = "#e8b86d",
  upColor = "#2dd4bf",
  downColor = "#f472b6",
  inkColor = "#fafafa",
  labelColor = "rgba(250,250,250,0.55)",
  showArea = true,
  durationInFrames = 34,
  staggerInFrames = 12,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  // Two stacks on one composition would otherwise share gradient ids and the
  // second would repaint the first.
  const uid = useId().replace(/:/g, "");

  const sparkHeight = rowHeight * 0.56;
  const strokeWidth = Math.max(2, rowHeight * 0.038);

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  return (
    <div style={{ width, display: "grid" }}>
      {rows.map((row, index) => {
        const start = delayInFrames + index * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );

        // Rows leave in the order they arrived, so the stack empties top-down
        // instead of blinking out as one block.
        const rowExit = clamp01((exit - index * 0.06) / 0.7);

        const domain = getChartDomain(row.values, { includeZero: false });
        const points = row.values.map((value, pointIndex) => ({
          x:
            (pointIndex / Math.max(1, row.values.length - 1)) *
            (sparkWidth - strokeWidth * 2) +
            strokeWidth,
          y:
            sparkHeight -
            strokeWidth -
            scaleValue(value, domain.min, domain.max) *
              (sparkHeight - strokeWidth * 2),
        }));

        const linePath = buildSmoothPath(points);
        const areaPath = buildAreaPath(linePath, points, sparkHeight);
        const last = points[points.length - 1];
        const lineColor = row.color ?? color;
        const { direction, text } = readDelta(row.delta);
        const deltaColor =
          direction === "up" ? upColor : direction === "down" ? downColor : labelColor;
        const gradientId = `${uid}-${index}-fill`;
        const clipId = `${uid}-${index}-clip`;

        return (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: width * 0.03,
              height: rowHeight,
              borderBottom:
                index === rows.length - 1
                  ? "none"
                  : "1px solid rgba(250,250,250,0.07)",
              opacity: clamp01(progress * 1.8) * (1 - rowExit),
              translate: `0 ${(1 - progress) * rowHeight * 0.22 + rowExit * rowHeight * 0.18}px`,
            }}
          >
            <span
              style={{
                color: labelColor,
                fontSize: rowHeight * 0.24,
                fontWeight: 600,
                flex: 1,
                whiteSpace: "nowrap",
              }}
            >
              {row.label}
            </span>

            <svg
              width={sparkWidth}
              height={sparkHeight}
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              style={{ overflow: "visible", flexShrink: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
                <clipPath id={clipId}>
                  <rect
                    x={0}
                    y={-strokeWidth}
                    width={sparkWidth * progress}
                    height={sparkHeight + strokeWidth * 2}
                  />
                </clipPath>
              </defs>

              {showArea && areaPath !== "" ? (
                <path
                  d={areaPath}
                  fill={`url(#${gradientId})`}
                  clipPath={`url(#${clipId})`}
                />
              ) : null}

              <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={getPathDrawStyles(progress, linePath)}
              />

              {last && progress > 0.92 ? (
                <circle
                  cx={last.x}
                  cy={last.y}
                  r={strokeWidth * 1.5}
                  fill={lineColor}
                  opacity={clamp01((progress - 0.92) / 0.08)}
                />
              ) : null}
            </svg>

            <span
              style={{
                color: inkColor,
                fontSize: rowHeight * 0.26,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                minWidth: width * 0.12,
                textAlign: "right",
              }}
            >
              {row.value ??
                formatCompactNumber(row.values[row.values.length - 1] ?? 0)}
            </span>

            {text === "" ? null : (
              <span
                style={{
                  color: deltaColor,
                  fontSize: rowHeight * 0.2,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: width * 0.09,
                  textAlign: "right",
                  // The delta is the conclusion of the row, so it waits for the
                  // line to finish drawing rather than pre-empting it.
                  opacity: clamp01((progress - 0.8) / 0.2),
                }}
              >
                {text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
