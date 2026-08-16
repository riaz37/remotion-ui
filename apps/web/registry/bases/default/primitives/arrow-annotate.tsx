import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ArrowAnnotateProps = {
  /** Start of the arrow, as a fraction of the box. Defaults to the top left. */
  from?: { x: number; y: number };
  /** Point the arrow lands on, as a fraction of the box. */
  to?: { x: number; y: number };
  /**
   * How far the shaft bows away from the straight line between the two points,
   * as a fraction of their distance. Negative bows the other way.
   */
  bow?: number;
  /** Text set beside the start of the shaft. */
  label?: string;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  /** Length of the head's barbs, in box units. */
  headSize?: number;
  /**
   * Draws the shaft twice with a small offset, the way a pen does when someone
   * goes over a line. Set false for a clean single stroke.
   */
  sketch?: boolean;
  /** Frames to wait before the shaft starts drawing. */
  delayInFrames?: number;
  /** Frames the shaft takes to draw. The head lands over the last quarter. */
  durationInFrames?: number;
  /** Frame the arrow starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A deterministic wobble. Frames render out of order, and two calls with the
 * same seed must return the same number on every machine — so this is a hash of
 * the seed, never a random.
 */
const jitter = (seed: number) => Math.sin(seed * 127.1) * 43758.5453 % 1;

/**
 * A hand-drawn arrow that draws itself: the shaft grows from its start, and the
 * head lands in the last quarter of the stroke, angled to the curve's own
 * tangent rather than to the straight line between the ends.
 *
 * The "hand-drawn" part is two passes over the same curve with a sub-pixel
 * offset, the way a pen doubles back on a line — not a wobbling path. A path
 * whose points move per frame reads as a shaking arrow, which is a different
 * and much worse effect.
 */
export const ArrowAnnotate: React.FC<ArrowAnnotateProps> = ({
  from = { x: 0.08, y: 0.16 },
  to = { x: 0.82, y: 0.74 },
  bow = 0.28,
  label,
  width = 320,
  height = 220,
  stroke = "#E8B86D",
  strokeWidth = 3,
  headSize = 18,
  sketch = true,
  delayInFrames = 0,
  durationInFrames = 40,
  exitAtInFrames,
  exitInFrames = 14,
}) => {
  const frame = useCurrentFrame();

  const x1 = from.x * width;
  const y1 = from.y * height;
  const x2 = to.x * width;
  const y2 = to.y * height;

  // Control point: the midpoint pushed along the line's own normal, so the bow
  // stays proportional whatever the arrow's length or angle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const cx = midX - dy * bow;
  const cy = midY + dx * bow;

  const draw = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    // Editorial, not `enter`: a strong ease-out spends most of the duration
    // barely moving, so a drawing stroke on it is finished in its first frames
    // and then crawls. A pen keeps roughly one speed.
    { easing: EASING.editorial, ...clamp },
  );
  // The head is the arrival, so it lands as the shaft finishes rather than
  // waiting for it — a head that appears after a settled line reads as a second
  // element instead of the end of the first.
  const head = interpolate(draw, [0.76, 1], [0, 1], clamp);

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  // Tangent of a quadratic at its end is the vector from the control point.
  const angle = Math.atan2(y2 - cy, x2 - cx);
  const barb = (spread: number) => ({
    x: x2 - Math.cos(angle - spread) * headSize,
    y: y2 - Math.sin(angle - spread) * headSize,
  });
  const left = barb(0.42);
  const right = barb(-0.42);

  const shaft = (pass: number) => {
    const offset = pass === 0 ? 0 : 1.1;
    return `M ${x1 + jitter(pass + 1) * offset} ${y1 + jitter(pass + 2) * offset} Q ${
      cx + jitter(pass + 3) * offset * 2
    } ${cy + jitter(pass + 4) * offset * 2}, ${x2} ${y2}`;
  };

  const passes = sketch ? [0, 1] : [0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ opacity: 1 - exit, overflow: "visible" }}
    >
      {passes.map((pass) => (
        <path
          key={pass}
          d={shaft(pass)}
          fill="none"
          stroke={stroke}
          strokeWidth={pass === 0 ? strokeWidth : strokeWidth * 0.6}
          strokeLinecap="round"
          // The second pass is fainter and trails the first slightly, which is
          // what makes the doubling read as one hand rather than two arrows.
          opacity={pass === 0 ? 0.95 : 0.45}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - (pass === 0 ? draw : Math.max(0, draw - 0.06))}
        />
      ))}

      <path
        d={`M ${left.x} ${left.y} L ${x2} ${y2} L ${right.x} ${right.y}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - head}
      />

      {label ? (
        <text
          x={x1 + (cx - x1) * 0.1}
          y={y1 - 10}
          fill={stroke}
          fontSize={16}
          fontWeight={600}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          opacity={interpolate(draw, [0.1, 0.45], [0, 1], clamp)}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
};
