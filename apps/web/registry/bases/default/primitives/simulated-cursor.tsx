import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { springSnappy } from "@/remotion/lib/springs";

export type SimulatedCursorProps = {
  points?: Array<{ x: number; y: number; frame: number }>;
  color?: string;
  size?: number;
  clickFrames?: number[];
};

const DEFAULT_POINTS = [
  { x: 18, y: 72, frame: 0 },
  { x: 42, y: 58, frame: 24 },
  { x: 68, y: 44, frame: 48 },
];

export const SimulatedCursor: React.FC<SimulatedCursorProps> = ({
  points = DEFAULT_POINTS,
  color = "#f4f4f5",
  size = 22,
  clickFrames = [48],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  let x = points[0]?.x ?? 50;
  let y = points[0]?.y ?? 50;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (frame >= b.frame) {
      continue;
    }
    if (frame < a.frame) {
      break;
    }

    const segProgress = interpolate(frame, [a.frame, b.frame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    });
    x = interpolate(segProgress, [0, 1], [a.x, b.x]);
    y = interpolate(segProgress, [0, 1], [a.y, b.y]);
    break;
  }

  if (frame >= (points[points.length - 1]?.frame ?? 0)) {
    const last = points[points.length - 1]!;
    x = last.x;
    y = last.y;
  }

  const activeClick = clickFrames.find((clickFrame) => frame >= clickFrame);
  const clickPulse =
    activeClick === undefined
      ? 0
      : spring({
          frame: frame - activeClick,
          fps,
          config: springSnappy,
          durationInFrames: 14,
        });
  const clicking = clickPulse > 0 && clickPulse < 0.95;
  const scale = clicking ? 0.9 - clickPulse * 0.04 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: (x / 100) * width,
        top: (y / 100) * height,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {clicking ? (
        <div
          style={{
            position: "absolute",
            left: size * 0.2,
            top: size * 0.2,
            width: 18 + clickPulse * 24,
            height: 18 + clickPulse * 24,
            borderRadius: "50%",
            border: "2px solid #e8b86d",
            opacity: Math.max(0, 0.75 - clickPulse * 0.75),
          }}
        />
      ) : null}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill={color}
          stroke="#080810"
          strokeWidth={1.2}
        />
      </svg>
    </div>
  );
};
