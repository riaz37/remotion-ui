import { interpolate, useCurrentFrame } from "remotion";
import { createLinePath, normalizePoints, type ChartPoint } from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";
import { getPathDrawStyles } from "@/remotion/lib/path-utils";

export type LineChartDrawProps = {
  points: ChartPoint[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  durationInFrames?: number;
};

export const LineChartDraw: React.FC<LineChartDrawProps> = ({
  points,
  width = 900,
  height = 360,
  color = "#4ade80",
  strokeWidth = 4,
  showDots = true,
  durationInFrames = 70,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const normalized = normalizePoints(points, width, height, 36);
  const path = createLinePath(normalized);
  const drawStyles = getPathDrawStyles(progress, path);
  const areaPath = `${path} L ${normalized[normalized.length - 1]?.x ?? width} ${height - 36} L ${normalized[0]?.x ?? 0} ${height - 36} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="line-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={36}
          y1={36 + (height - 72) * ratio}
          x2={width - 36}
          y2={36 + (height - 72) * ratio}
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={1}
        />
      ))}
      <path
        d={areaPath}
        fill="url(#line-chart-fill)"
        opacity={progress * 0.85}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={drawStyles}
      />
      {showDots
        ? normalized.map((point, index) => {
            const dotProgress = interpolate(
              progress,
              [index / normalized.length, (index + 1) / normalized.length],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <circle
                key={`${point.x}-${point.y}`}
                cx={point.x}
                cy={point.y}
                r={5 * dotProgress}
                fill={color}
                stroke="#0a1014"
                strokeWidth={2}
              />
            );
          })
        : null}
    </svg>
  );
};
