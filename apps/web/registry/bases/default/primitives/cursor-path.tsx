import { interpolate, useCurrentFrame } from "remotion";

export type CursorPoint = {
  x: number;
  y: number;
};

export type CursorPathProps = {
  points: CursorPoint[];
  durationInFrames?: number;
  color?: string;
  size?: number;
};

function interpolatePoint(points: CursorPoint[], progress: number) {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const segmentProgress = progress * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(segmentProgress));
  const localProgress = segmentProgress - index;
  const from = points[index];
  const to = points[index + 1];

  return {
    x: from.x + (to.x - from.x) * localProgress,
    y: from.y + (to.y - from.y) * localProgress,
  };
}

export const CursorPath: React.FC<CursorPathProps> = ({
  points,
  durationInFrames = 90,
  color = "#e8b86d",
  size = 34,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const position = interpolatePoint(points, progress);
  const trailPath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="cursor-glow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d={trailPath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeOpacity={0.35}
        strokeDasharray="6 8"
        strokeLinecap="round"
      />
      <g transform={`translate(${position.x} ${position.y})`} filter="url(#cursor-glow)">
        <path
          d={`M0 0 L0 ${size} L9 ${size - 9} L16 ${size} L22 ${size - 4} L15 ${size - 15} L${size} ${size - 15} Z`}
          fill="#f8fafc"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
