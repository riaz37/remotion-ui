import { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  buildSmoothPath,
  formatAxisValue,
  getPlotArea,
  niceDomain,
  scaleValue,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type StackedSeries = {
  label: string;
  /** One value per x position. Series must all be the same length. */
  values: number[];
  color?: string;
};

export type StackedAreaChartProps = {
  series: StackedSeries[];
  /** Category labels along the x axis, one per value. */
  labels?: string[];
  width?: number;
  height?: number;
  colors?: string[];
  /** Gridlines and value labels down the left gutter. */
  showAxis?: boolean;
  /** Category labels under the plot. */
  showXLabels?: boolean;
  /** Series names, in stack order. */
  showLegend?: boolean;
  /** Hairline along the top of each band. */
  showBoundaries?: boolean;
  gridColor?: string;
  labelColor?: string;
  fillOpacity?: number;
  valueFormatter?: (value: number) => string;
  /** Length of the wipe across the whole plot. */
  durationInFrames?: number;
  /** Frames one band trails the band below it by. */
  bandOffsetInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once wiped in. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5", "#f59e0b"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Bands stacked on a shared baseline, wiping in from the left.
 *
 * The reveal is a clip that travels across the plot, not an opacity fade or a
 * vertical grow. A stacked area is read as a history, so uncovering it in time
 * order is the only reveal that agrees with the axis underneath it.
 *
 * Bands are drawn bottom-up and each is offset a few frames behind the one
 * below, so the stack assembles in the order it is read rather than as one
 * moving wall.
 */
export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
  series,
  labels,
  width = 880,
  height = 460,
  colors = DEFAULT_COLORS,
  showAxis = true,
  showXLabels = true,
  showLegend = true,
  showBoundaries = true,
  gridColor = "rgba(250,250,250,0.10)",
  labelColor = "rgba(250,250,250,0.55)",
  fillOpacity = 0.85,
  valueFormatter = formatAxisValue,
  durationInFrames = 60,
  bandOffsetInFrames = 8,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  // Two charts on one composition would otherwise share clip ids and the second
  // would cut the first.
  const uid = useId().replace(/:/g, "");

  const unit = width / 960;
  const labelSize = Math.max(11, Math.round(21 * unit));
  const pointCount = series.reduce(
    (longest, entry) => Math.max(longest, entry.values.length),
    0,
  );

  // Cumulative tops, band by band: each band's upper edge is the sum of every
  // series at or below it, which is also the lower edge of the next one.
  const stacks: number[][] = [];
  series.forEach((entry, index) => {
    const below = stacks[index - 1];
    stacks.push(
      Array.from({ length: pointCount }, (_, position) => {
        const base = below?.[position] ?? 0;
        return base + (entry.values[position] ?? 0);
      }),
    );
  });

  const peakStack = stacks[stacks.length - 1] ?? [];
  const domain = niceDomain(peakStack, { includeZero: true, tickCount: 4 });

  const plot = getPlotArea(width, height, {
    top: showLegend ? labelSize * 2.6 : labelSize,
    right: labelSize,
    bottom: showXLabels ? labelSize * 2.6 : labelSize,
    left: showAxis ? labelSize * 3.4 : labelSize,
  });

  const x = (position: number) =>
    plot.left + (position / Math.max(1, pointCount - 1)) * plot.width;
  const y = (value: number) =>
    plot.bottom - scaleValue(value, domain.min, domain.max) * plot.height;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showAxis
        ? domain.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={plot.left}
                y1={y(tick)}
                x2={plot.right}
                y2={y(tick)}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text
                x={plot.left - labelSize * 0.6}
                y={y(tick)}
                fill={labelColor}
                fontSize={labelSize}
                fontWeight={600}
                textAnchor="end"
                dominantBaseline="central"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter(tick)}
              </text>
            </g>
          ))
        : null}

      {series.map((entry, index) => {
        const start = delayInFrames + index * bandOffsetInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.editorial },
        );
        // The stack retreats the way it arrived, top band first.
        const drain = clamp01(
          (exit - ((series.length - 1 - index) / series.length) * 0.25) / 0.75,
        );
        const revealed = clamp01(progress - drain);
        if (revealed <= 0) return null;

        const top = stacks[index].map((value, position) => ({
          x: x(position),
          y: y(value),
        }));
        const bottom = (stacks[index - 1] ?? stacks[index].map(() => 0)).map(
          (value, position) => ({ x: x(position), y: y(value) }),
        );

        const topPath = buildSmoothPath(top);
        const bottomPath = buildSmoothPath([...bottom].reverse());
        // The band is closed by walking the lower boundary backwards, so the two
        // smoothed edges meet exactly instead of leaving a sliver at the seam.
        const areaPath = `${topPath} L ${bottom[bottom.length - 1].x} ${bottom[bottom.length - 1].y} ${bottomPath.replace(/^M/, "L")} Z`;

        const colour = entry.color ?? colors[index % colors.length];
        const clipId = `${uid}-${index}-wipe`;

        return (
          <g key={entry.label}>
            <defs>
              <clipPath id={clipId}>
                <rect
                  x={plot.left}
                  y={plot.top}
                  width={plot.width * revealed}
                  height={plot.height}
                />
              </clipPath>
            </defs>
            <path
              d={areaPath}
              fill={colour}
              fillOpacity={fillOpacity}
              clipPath={`url(#${clipId})`}
            />
            {showBoundaries ? (
              <path
                d={topPath}
                fill="none"
                stroke={colour}
                strokeWidth={Math.max(1.5, 2.5 * unit)}
                strokeLinecap="round"
                clipPath={`url(#${clipId})`}
              />
            ) : null}
          </g>
        );
      })}

      {showXLabels && labels
        ? labels.map((label, position) => (
            <text
              key={label}
              x={x(position)}
              y={plot.bottom + labelSize * 1.3}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={600}
              textAnchor={
                position === 0
                  ? "start"
                  : position === pointCount - 1
                    ? "end"
                    : "middle"
              }
              dominantBaseline="central"
              opacity={1 - clamp01(exit / 0.7)}
            >
              {label}
            </text>
          ))
        : null}

      {showLegend
        ? series.map((entry, index) => {
            const colour = entry.color ?? colors[index % colors.length];
            const swatch = labelSize * 0.8;
            const gap = labelSize * 7;
            return (
              <g
                key={`legend-${entry.label}`}
                opacity={
                  clamp01(
                    (frame - (delayInFrames + index * bandOffsetInFrames)) / 12,
                  ) *
                  (1 - clamp01(exit / 0.7))
                }
              >
                <rect
                  x={plot.left + index * gap}
                  y={labelSize * 0.6}
                  width={swatch}
                  height={swatch}
                  rx={3}
                  fill={colour}
                />
                <text
                  x={plot.left + index * gap + swatch * 1.6}
                  y={labelSize}
                  fill={labelColor}
                  fontSize={labelSize}
                  fontWeight={600}
                  dominantBaseline="central"
                >
                  {entry.label}
                </text>
              </g>
            );
          })
        : null}
    </svg>
  );
};
