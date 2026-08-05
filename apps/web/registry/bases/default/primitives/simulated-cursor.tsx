import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springSmooth, springSnappy } from "@/remotion/lib/springs";

export type SimulatedCursorPoint = {
  /** Percentage of the frame width — 0 is the left edge, 100 the right. */
  x: number;
  /** Percentage of the frame height. */
  y: number;
  /** Frame the cursor arrives at this point. */
  frame: number;
  /** Chip shown next to the cursor while it rests here. */
  label?: string;
  /** Ring drawn under the cursor, sized in pixels — marks the hit target. */
  target?: number;
};

export type SimulatedCursorProps = {
  points?: SimulatedCursorPoint[];
  color?: string;
  accent?: string;
  size?: number;
  clickFrames?: number[];
};

const DEFAULT_POINTS: SimulatedCursorPoint[] = [
  { x: 18, y: 72, frame: 0 },
  { x: 42, y: 58, frame: 24 },
  { x: 68, y: 44, frame: 48, target: 72 },
];

const CLICK_DURATION = 16;
/** How long a press holds the pointer down before it springs back. */
const PRESS_FRAMES = 5;

export const SimulatedCursor: React.FC<SimulatedCursorProps> = ({
  points = DEFAULT_POINTS,
  color = "#f4f4f5",
  accent = "#e8b86d",
  size = 26,
  clickFrames = [48],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const first = points[0] ?? { x: 50, y: 50, frame: 0 };
  const last = points[points.length - 1] ?? first;

  // Each hop is its own spring, so the cursor settles into a target the way a
  // hand does — decelerating hard — instead of gliding at a constant rate.
  let position = { x: first.x, y: first.y };
  let resting: SimulatedCursorPoint = first;

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];

    if (frame >= to.frame) {
      continue;
    }
    if (frame < from.frame) {
      break;
    }

    const travel = spring({
      frame: frame - from.frame,
      fps,
      config: springSmooth,
      durationInFrames: Math.max(1, to.frame - from.frame),
    });
    position = {
      x: interpolate(travel, [0, 1], [from.x, to.x]),
      y: interpolate(travel, [0, 1], [from.y, to.y]),
    };
    resting = travel > 0.75 ? to : from;
    break;
  }

  if (frame >= last.frame) {
    position = { x: last.x, y: last.y };
    resting = last;
  }

  const activeClick = clickFrames
    .filter((clickFrame) => frame >= clickFrame)
    .pop();
  const clickPulse =
    activeClick === undefined
      ? 0
      : spring({
          frame: frame - activeClick,
          fps,
          config: springSnappy,
          durationInFrames: CLICK_DURATION,
        });
  const clicking = clickPulse > 0 && clickPulse < 1;
  const pressed =
    activeClick !== undefined && frame - activeClick < PRESS_FRAMES;

  const left = (position.x / 100) * width;
  const top = (position.y / 100) * height;
  const showTarget = resting.target !== undefined;
  // The label belongs to the point the cursor is arriving at, so it fades in
  // just before touchdown rather than after the cursor has already stopped.
  const labelOpacity = resting.label
    ? interpolate(frame, [resting.frame - 8, resting.frame - 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {showTarget ? (
        <div
          style={{
            position: "absolute",
            left: -(resting.target ?? 0) / 2 + size * 0.2,
            top: -(resting.target ?? 0) / 2 + size * 0.2,
            width: resting.target,
            height: resting.target,
            borderRadius: 999,
            border: `2px solid ${accent}`,
            opacity: clicking ? 0.75 : 0.32,
          }}
        />
      ) : null}

      {clicking ? (
        <div
          style={{
            position: "absolute",
            left: size * 0.2 - clickPulse * 26,
            top: size * 0.2 - clickPulse * 26,
            width: 12 + clickPulse * 52,
            height: 12 + clickPulse * 52,
            borderRadius: 999,
            border: `2px solid ${accent}`,
            opacity: Math.max(0, 0.8 - clickPulse * 0.8),
          }}
        />
      ) : null}

      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          display: "block",
          scale: pressed ? 0.88 : 1,
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
        }}
      >
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill={color}
          stroke="#080810"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>

      {resting.label ? (
        <div
          style={{
            position: "absolute",
            left: size * 0.9,
            top: size * 0.9,
            padding: "6px 12px",
            borderRadius: 6,
            background: "rgba(8,8,16,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#ececec",
            fontSize: 18,
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: labelOpacity,
          }}
        >
          {resting.label}
        </div>
      ) : null}
    </div>
  );
};
