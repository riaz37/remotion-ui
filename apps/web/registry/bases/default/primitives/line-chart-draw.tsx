import { useId } from "react";
import { getLength, getPointAtLength } from "@remotion/paths";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  buildAreaPath,
  buildLinePath,
  buildSmoothPath,
  formatAxisValue,
  getPlotArea,
  niceDomain,
  plotPoints,
  type ChartPoint,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";
import { getPathDrawStyles } from "@/remotion/lib/path-utils";

export type LineChartDrawProps = {
  points: ChartPoint[];
  /** Drawing width. Defaults to the composition width. */
  width?: number;
  /** Drawing height. Defaults to 40% of the composition height. */
  height?: number;
  color?: string;
  strokeWidth?: number;
  /** Cardinal spline through the points, or straight segments. */
  variant?: "smooth" | "linear";
  /** Gridlines and value labels down the left gutter. */
  showAxis?: boolean;
  /** Category labels under the plot, read from `point.label`. */
  showXLabels?: boolean;
  /** Gradient fill under the line, wiped in with the draw. */
  showArea?: boolean;
  /** Dot deposited on each data point as the line passes it. */
  showDots?: boolean;
  /** Glowing dot riding the tip of the line while it draws. */
  showHead?: boolean;
  /** Value callout pinned to the final point once the draw lands. */
  showEndLabel?: boolean;
  /**
   * Anchor the value axis at zero. Turn it off for sparklines, where the shape
   * of the recent range matters more than its distance from zero.
   */
  includeZero?: boolean;
  /** Formats axis ticks and the end label. */
  valueFormatter?: (value: number) => string;
  /** Text colour for axis and category labels. */
  labelColor?: string;
  gridColor?: string;
  /** Ink behind the dots — match the surface the chart sits on. */
  surfaceColor?: string;
  durationInFrames?: number;
  delayInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A line chart that draws itself on.
 *
 * The line, its fill, gridlines and labels are all projected from one plot
 * rectangle (see `chart-utils`), so the geometry stays locked together at any
 * size. The draw is a single progress value: the stroke evolves along its own
 * length, the fill is wiped by a clip rect, and each dot lands as the tip
 * passes it — one gesture instead of several animations that merely overlap.
 */
export const LineChartDraw: React.FC<LineChartDrawProps> = ({
  points,
  width: widthProp,
  height: heightProp,
  color = "#e8b86d",
  strokeWidth: strokeWidthProp,
  variant = "smooth",
  showAxis = true,
  showXLabels = true,
  showArea = true,
  showDots = true,
  showHead = true,
  showEndLabel = false,
  includeZero = true,
  valueFormatter = formatAxisValue,
  labelColor = "rgba(250,250,250,0.52)",
  gridColor = "rgba(250,250,250,0.10)",
  surfaceColor = "#080810",
  durationInFrames = 70,
  delayInFrames = 0,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const config = useVideoConfig();
  const width = widthProp ?? config.width;
  const height = heightProp ?? Math.round(config.height * 0.4);

  // Type scales off the chart's own width, so a chart dropped into a narrow
  // column keeps the same label-to-plot ratio as a full-bleed one.
  const unit = width / 960;
  const scale = (value: number) => Math.max(1, Math.round(value * unit));
  const labelSize = scale(22);
  const strokeWidth = strokeWidthProp ?? scale(5);

  const domain = niceDomain(
    points.map((point) => point.y),
    { includeZero, tickCount: 4 },
  );
  // Called with one argument on purpose — a point-free `.map(valueFormatter)`
  // would feed the array index into a formatter's second parameter.
  const axisLabels = domain.ticks.map((tick) => valueFormatter(tick));
  const longestLabel = axisLabels.reduce(
    (longest, label) => Math.max(longest, label.length),
    0,
  );
  const gutter = showAxis
    ? Math.round(longestLabel * labelSize * 0.62) + scale(18)
    : scale(6);

  const plot = getPlotArea(width, height, {
    top: scale(showEndLabel ? 34 : 16),
    right: scale(showEndLabel ? 44 : 12),
    bottom: showXLabels ? labelSize + scale(20) : scale(10),
    left: gutter,
  });

  const plotted = plotPoints(points, plot, domain);
  const linePath =
    variant === "smooth" ? buildSmoothPath(plotted) : buildLinePath(plotted);
  const areaPath = buildAreaPath(linePath, plotted, plot.bottom);

  const progress = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  // The tip is read off the real path rather than inferred from progress, so
  // it tracks the curve instead of floating beside it on steep segments.
  const pathLength = linePath === "" ? 0 : getLength(linePath);
  const fallbackTip = { x: plot.left, y: plot.bottom };
  const tip =
    (pathLength > 0
      ? getPointAtLength(linePath, pathLength * progress)
      : null) ?? fallbackTip;

  // Two charts on one frame would otherwise share a gradient id and the second
  // would repaint the first.
  const uid = useId().replace(/:/g, "");
  const gradientId = `${uid}-fill`;
  const clipId = `${uid}-clip`;

  const endPoint = plotted[plotted.length - 1];
  const endLabelOpacity = interpolate(progress, [0.88, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect
            x={plot.left}
            y={plot.top - strokeWidth}
            width={plot.width * progress}
            height={plot.height + strokeWidth * 2}
          />
        </clipPath>
      </defs>

      {showAxis
        ? domain.ticks.map((tick, index) => {
            const y =
              plot.bottom - ((tick - domain.min) / domain.span) * plot.height;

            return (
              <g key={tick}>
                <line
                  x1={plot.left}
                  y1={y}
                  x2={plot.right}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                  // The zero line carries the baseline, so it reads heavier.
                  opacity={index === 0 ? 1.8 : 1}
                />
                <text
                  x={plot.left - scale(12)}
                  y={y}
                  fill={labelColor}
                  fontSize={labelSize}
                  fontWeight={600}
                  textAnchor="end"
                  dominantBaseline="central"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {axisLabels[index]}
                </text>
              </g>
            );
          })
        : null}

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
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={getPathDrawStyles(progress, linePath)}
      />

      {showXLabels
        ? plotted.map((point, index) => (
            <text
              key={`${point.x}-label`}
              x={point.x}
              y={plot.bottom + scale(14) + labelSize / 2}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={600}
              // End labels anchor inward so they never clip the plot edges.
              textAnchor={
                index === 0
                  ? "start"
                  : index === plotted.length - 1
                    ? "end"
                    : "middle"
              }
              dominantBaseline="central"
            >
              {point.label ?? ""}
            </text>
          ))
        : null}

      {showDots
        ? plotted.map((point) => {
            // Dots grow in as the tip clears them, over a short window, so the
            // reveal reads as the line depositing them rather than a blink.
            const window = Math.max(1, plot.width * 0.04);
            const reveal = clamp01((tip.x - point.x + window) / window);

            return (
              <circle
                key={`${point.x}-dot`}
                cx={point.x}
                cy={point.y}
                r={strokeWidth * 0.95 * reveal}
                fill={color}
                stroke={surfaceColor}
                strokeWidth={strokeWidth * 0.5 * reveal}
              />
            );
          })
        : null}

      {showHead && progress > 0 && progress < 1 ? (
        <g>
          <circle
            cx={tip.x}
            cy={tip.y}
            r={strokeWidth * 2.6}
            fill={color}
            opacity={0.18}
          />
          <circle cx={tip.x} cy={tip.y} r={strokeWidth * 1.05} fill={color} />
        </g>
      ) : null}

      {showEndLabel && endPoint ? (
        <text
          x={endPoint.x}
          y={endPoint.y - scale(22)}
          fill={color}
          fontSize={scale(28)}
          fontWeight={700}
          textAnchor="end"
          dominantBaseline="central"
          opacity={endLabelOpacity}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {valueFormatter(endPoint.value)}
        </text>
      ) : null}
    </svg>
  );
};
