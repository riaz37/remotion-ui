import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springSmooth, springSnappy } from "@/remotion/lib/springs";

/**
 * film-cursor — the hand, drawn the way a screen recording draws one.
 *
 * The registry's `SimulatedCursor` puts the target ring at the cursor's own
 * position, which means a 96px reticle slides across the interface for the
 * whole flight and then stacks under the click ripple. On a film built out of
 * real screenshots that single detail is what says "this is a synthetic demo".
 *
 * So this one draws the ring at the *destination*, and only once the cursor has
 * essentially arrived — a hit target the hand is landing on, not a halo it
 * carries. It also hides the ring while a click ripple is expanding, so the two
 * marks never sit concentric.
 *
 * Positions are percentages of the frame, matching the registry component, so
 * `toCursorPoint` keeps working. The component is local rather than a fork of
 * the registry file because `registry/` ships to other people's repos.
 */

export type FilmCursorPoint = {
  /** Percentage of the frame width — 0 is the left edge, 100 the right. */
  x: number;
  /** Percentage of the frame height. */
  y: number;
  /** Frame the cursor arrives at this point. */
  frame: number;
  /** Ring drawn on this point once the cursor lands, sized in pixels. */
  target?: number;
};

export type FilmCursorProps = {
  points: FilmCursorPoint[];
  clickFrames: number[];
  size?: number;
  color?: string;
  accent?: string;
  /** Frames over which the whole cursor fades away at the end of its pass. */
  fadeOut?: number;
  /** Length of the pass, used only to place that fade. */
  durationInFrames: number;
};

const CLICK_DURATION = 16;
/** How long a press holds the pointer down before it springs back. */
const PRESS_FRAMES = 5;
/**
 * How close, in composition pixels, the hand has to be to its destination for
 * the hit target to be drawn. Measured as distance rather than as spring
 * progress so a point held across several frames keeps its ring.
 */
const ARRIVED = { far: 70, near: 8 } as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The SVG arrow's tip sits at (5,3) in its 24-unit viewBox, so the container
 * has to be offset by that much for the declared point to be the hot spot.
 */
const TIP = { x: 5 / 24, y: 3 / 24 };

export const FilmCursor: React.FC<FilmCursorProps> = ({
  points,
  clickFrames,
  size = 24,
  color = "#f4f4f5",
  accent = "#e8b86d",
  fadeOut = 8,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const first = points[0];
  const last = points[points.length - 1];

  // Each hop is its own spring, so the cursor settles into a target the way a
  // hand does — decelerating hard — instead of gliding at a constant rate.
  let position = { x: first.x, y: first.y };
  let landing: FilmCursorPoint = first;

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
    // The ring belongs to where the hand is going, not where it has been.
    landing = to;
    break;
  }

  if (frame >= last.frame) {
    position = { x: last.x, y: last.y };
    landing = last;
  }

  const activeClick = clickFrames.filter((at) => frame >= at).pop();
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
  const pressed = activeClick !== undefined && frame - activeClick < PRESS_FRAMES;

  const left = (position.x / 100) * width - size * TIP.x;
  const top = (position.y / 100) * height - size * TIP.y;

  // The ring fades up over the last tenth of the flight and is suppressed while
  // a ripple is running, so a press is one mark rather than three.
  const distance = Math.hypot(
    ((position.x - landing.x) / 100) * width,
    ((position.y - landing.y) / 100) * height,
  );
  const ringOpacity =
    landing.target === undefined || clicking
      ? 0
      : interpolate(distance, [ARRIVED.near, ARRIVED.far], [0.34, 0], clamp);

  const exit = interpolate(
    frame,
    [durationInFrames - fadeOut, durationInFrames],
    [1, 0],
    clamp,
  );

  return (
    <div style={{ opacity: exit }}>
      {ringOpacity > 0 ? (
        <div
          style={{
            position: "absolute",
            left: (landing.x / 100) * width - landing.target! / 2,
            top: (landing.y / 100) * height - landing.target! / 2,
            width: landing.target,
            height: landing.target,
            borderRadius: 999,
            border: `2px solid ${accent}`,
            opacity: ringOpacity,
            zIndex: 19,
          }}
        />
      ) : null}

      {clicking ? (
        <div
          style={{
            position: "absolute",
            left: (position.x / 100) * width - (6 + clickPulse * 26),
            top: (position.y / 100) * height - (6 + clickPulse * 26),
            width: 12 + clickPulse * 52,
            height: 12 + clickPulse * 52,
            borderRadius: 999,
            border: `2px solid ${accent}`,
            opacity: Math.max(0, 0.85 - clickPulse * 0.85),
            zIndex: 19,
          }}
        />
      ) : null}

      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          position: "absolute",
          left,
          top,
          zIndex: 20,
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
    </div>
  );
};
