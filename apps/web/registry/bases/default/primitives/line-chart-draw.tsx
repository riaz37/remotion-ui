import { interpolate, useCurrentFrame } from "remotion";
import { createLinePath, normalizePoints, type ChartPoint } from "@/remotion/lib/chart-utils";
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
  color = "#60a5fa",
  strokeWidth = 4,
  showDots = true,
  durationInFrames = 70,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const normalized = normalizePoints(points, width, height, 36);
  const path = createLinePath(normalized);
  const drawStyles = getPathDrawStyles(progress, path);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
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
              />
            );
          })
        : null}
    </svg>
  );
};
