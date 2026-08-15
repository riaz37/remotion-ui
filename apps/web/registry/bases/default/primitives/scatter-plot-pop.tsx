import { interpolate, useCurrentFrame } from "remotion";
import {
  formatAxisValue,
  getPlotArea,
  niceDomain,
  scaleValue,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ScatterPoint = {
  x: number;
  y: number;
  /** Relative weight. Scales the dot radius between `minRadius` and `maxRadius`. */
  weight?: number;
  color?: string;
};

export type ScatterPlotPopProps = {
  points: ScatterPoint[];
  width?: number;
  height?: number;
  color?: string;
  minRadius?: number;
  maxRadius?: number;
  /** Least-squares trend line, drawn once the points have landed. */
  showTrend?: boolean;
  trendColor?: string;
  /** Gridlines and value labels on both axes. */
  showAxis?: boolean;
  gridColor?: string;
  labelColor?: string;
  xLabel?: string;
  yLabel?: string;
  /** Length of one dot's pop. */
  durationInFrames?: number;
  /** Frames between one dot and the next, in ascending x order. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once landed. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A scatter plot whose points pop in from left to right.
 *
 * The stagger follows ascending x rather than array order, so the cloud fills
 * the way the axis is read no matter how the data arrived. The trend line waits
 * for the last dot: drawn earlier it would state a correlation over points the
 * viewer has not seen yet.
 */
export const ScatterPlotPop: React.FC<ScatterPlotPopProps> = ({
  points,
  width = 860,
  height = 480,
  color = "#e8b86d",
  minRadius = 7,
  maxRadius = 20,
  showTrend = true,
  trendColor = "rgba(250,250,250,0.42)",
  showAxis = true,
  gridColor = "rgba(250,250,250,0.10)",
  labelColor = "rgba(250,250,250,0.52)",
  xLabel,
  yLabel,
  durationInFrames = 16,
  staggerInFrames = 2.5,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const unit = width / 960;
  const labelSize = Math.max(12, Math.round(22 * unit));

  const xDomain = niceDomain(
    points.map((point) => point.x),
    { includeZero: false, tickCount: 4 },
  );
  const yDomain = niceDomain(
    points.map((point) => point.y),
    { includeZero: false, tickCount: 4 },
  );

  const plot = getPlotArea(width, height, {
    top: maxRadius + 8,
    right: maxRadius + 8,
    bottom: labelSize * (xLabel ? 3.4 : 2.2),
    left: labelSize * 3.4,
  });

  const project = (point: { x: number; y: number }) => ({
    x: plot.left + scaleValue(point.x, xDomain.min, xDomain.max) * plot.width,
    y: plot.bottom - scaleValue(point.y, yDomain.min, yDomain.max) * plot.height,
  });

  // Rank in x, kept beside each point so the stagger can use it without
  // reordering the array the caller passed in.
  const order = points
    .map((point, index) => ({ index, x: point.x }))
    .sort((a, b) => a.x - b.x)
    .reduce<number[]>((ranks, entry, rank) => {
      ranks[entry.index] = rank;
      return ranks;
    }, []);

  const lastStart = delayInFrames + Math.max(0, points.length - 1) * staggerInFrames;
  const trendProgress = interpolate(
    frame,
    [lastStart + durationInFrames * 0.4, lastStart + durationInFrames * 0.4 + 26],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
  );

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  // Least squares over the raw values, then projected — fitting in screen space
  // would invert the slope, since y grows downward there.
  const count = points.length || 1;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / count;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / count;
  const covariance = points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const variance = points.reduce(
    (sum, point) => sum + (point.x - meanX) ** 2,
    0,
  );
  const slope = variance === 0 ? 0 : covariance / variance;
  const trendStart = project({
    x: xDomain.min,
    y: meanY + slope * (xDomain.min - meanX),
  });
  const trendEnd = project({
    x: xDomain.max,
    y: meanY + slope * (xDomain.max - meanX),
  });

  const weights = points.map((point) => point.weight ?? 1);
  const maxWeight = Math.max(...weights, 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showAxis
        ? yDomain.ticks.map((tick) => {
            const y =
              plot.bottom - scaleValue(tick, yDomain.min, yDomain.max) * plot.height;
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={plot.left}
                  y1={y}
                  x2={plot.right}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                />
                <text
                  x={plot.left - labelSize * 0.6}
                  y={y}
                  fill={labelColor}
                  fontSize={labelSize}
                  fontWeight={600}
                  textAnchor="end"
                  dominantBaseline="central"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatAxisValue(tick)}
                </text>
              </g>
            );
          })
        : null}

      {showAxis
        ? xDomain.ticks.map((tick) => {
            const x =
              plot.left + scaleValue(tick, xDomain.min, xDomain.max) * plot.width;
            return (
              <text
                key={`x-${tick}`}
                x={x}
                y={plot.bottom + labelSize * 1.2}
                fill={labelColor}
                fontSize={labelSize}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAxisValue(tick)}
              </text>
            );
          })
        : null}

      {showTrend && trendProgress > 0 ? (
        <line
          x1={trendStart.x}
          y1={trendStart.y}
          x2={trendStart.x + (trendEnd.x - trendStart.x) * trendProgress}
          y2={trendStart.y + (trendEnd.y - trendStart.y) * trendProgress}
          stroke={trendColor}
          strokeWidth={Math.max(2, 4 * unit)}
          strokeDasharray={`${12 * unit} ${10 * unit}`}
          strokeLinecap="round"
          opacity={1 - clamp01(exit / 0.6)}
        />
      ) : null}

      {points.map((point, index) => {
        const rank = order[index] ?? index;
        const start = delayInFrames + rank * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.pop },
        );
        // Dots leave in the same left-to-right order they arrived in.
        const drain = clamp01(
          (exit - (rank / Math.max(1, points.length)) * 0.3) / 0.7,
        );
        const shown = clamp01(progress) * (1 - drain);
        if (shown <= 0) return null;

        const position = project(point);
        const radius =
          minRadius +
          ((point.weight ?? 1) / maxWeight) * (maxRadius - minRadius);

        return (
          <g key={`${point.x}-${point.y}-${index}`}>
            <circle
              cx={position.x}
              cy={position.y}
              r={radius * shown * 2.2}
              fill={point.color ?? color}
              opacity={0.14 * shown}
            />
            <circle
              cx={position.x}
              cy={position.y}
              r={radius * shown}
              fill={point.color ?? color}
              opacity={0.9}
            />
          </g>
        );
      })}

      {xLabel ? (
        <text
          x={plot.left + plot.width / 2}
          y={height - labelSize * 0.4}
          fill={labelColor}
          fontSize={labelSize}
          fontWeight={600}
          textAnchor="middle"
        >
          {xLabel}
        </text>
      ) : null}

      {yLabel ? (
        <text
          x={labelSize}
          y={plot.top + plot.height / 2}
          fill={labelColor}
          fontSize={labelSize}
          fontWeight={600}
          textAnchor="middle"
          transform={`rotate(-90 ${labelSize} ${plot.top + plot.height / 2})`}
        >
          {yLabel}
        </text>
      ) : null}
    </svg>
  );
};
