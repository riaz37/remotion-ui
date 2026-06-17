import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

export type DataFlowPipesProps = {
  backgroundColor?: string;
  pipeColor?: string;
  packetColor?: string;
};

type Node = { x: number; y: number };

const NODES: Node[] = [
  { x: 12, y: 50 },
  { x: 38, y: 28 },
  { x: 38, y: 72 },
  { x: 68, y: 50 },
  { x: 88, y: 50 },
];

export const DataFlowPipes: React.FC<DataFlowPipesProps> = ({
  backgroundColor = "#080810",
  pipeColor = "rgba(45,212,191,0.35)",
  packetColor = "#e8b86d",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const innerW = width - safe.paddingLeft - safe.paddingRight;
  const innerH = height - safe.paddingTop - safe.paddingBottom;
  const reveal = interpolate(frame, [0, DURATION.normal], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const toPx = (n: Node) => ({
    x: safe.paddingLeft + (n.x / 100) * innerW,
    y: safe.paddingTop + (n.y / 100) * innerH,
  });

  const paths = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ];

  return (
    <div style={{ width, height, background: backgroundColor, position: "relative" }}>
      <svg width={width} height={height}>
        {paths.map(([a, b], i) => {
          const p1 = toPx(NODES[a]!);
          const p2 = toPx(NODES[b]!);
          const d = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y}`;
          const len = 400;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={pipeColor}
              strokeWidth={4}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - reveal)}
            />
          );
        })}
        {paths.map(([a, b], i) => {
          const p1 = toPx(NODES[a]!);
          const p2 = toPx(NODES[b]!);
          const t = ((frame * 2 + i * 30) % 120) / 120;
          const x = p1.x + (p2.x - p1.x) * t;
          const y = p1.y + (p2.y - p1.y) * t;
          return (
            <circle key={`pkt-${i}`} cx={x} cy={y} r={7} fill={packetColor} opacity={reveal} />
          );
        })}
      </svg>
    </div>
  );
};
