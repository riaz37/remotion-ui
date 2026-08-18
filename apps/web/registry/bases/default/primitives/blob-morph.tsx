import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { morphSequence, prepareMorphSequence } from "@/remotion/lib/path-morph";

export type BlobMorphProps = {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Frames for one full trip around the ring of shapes. */
  periodInFrames?: number;
  /** How many shapes the loop travels through. Three to six reads as organic. */
  states?: number;
  /** Points around the outline. More points, more detail and more wobble. */
  points?: number;
  /** How far the outline deviates from a circle, as a fraction of the radius. */
  amplitude?: number;
  /** Changes the shape family without changing anything else. */
  seed?: number;
  /**
   * Degrees the blob turns per period, on top of the morph. The turn is
   * continuous rather than wrapping, so for a seamless loop set it to 0 or to a
   * multiple of 360 — anything else leaves the shape at a different angle each
   * time round.
   */
  rotation?: number;
};

/**
 * Deterministic hash. Frames render out of order and on different machines, so
 * every value here has to come from arithmetic on the seed, never from a random.
 */
const hash = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/**
 * A closed blob as a cubic path.
 *
 * Every variant is generated with the same point count, so all of them reduce
 * to the same number of curve commands — which is what lets them morph into
 * each other without the interpolator having to invent segments.
 */
const makeBlob = (state: number, points: number, amplitude: number, seed: number) => {
  const radii = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    // Three harmonics: the first two give the lobes, the third breaks the
    // symmetry that two alone would leave behind.
    const wobble =
      Math.sin(angle * 2 + state * 1.7 + hash(seed) * 6.3) * 0.6 +
      Math.sin(angle * 3 - state * 1.1 + hash(seed + 1) * 6.3) * 0.28 +
      Math.sin(angle * 5 + state * 0.6 + hash(seed + 2) * 6.3) * 0.12;
    return 38 * (1 + wobble * amplitude);
  });

  const point = (index: number) => {
    const wrapped = (index + points) % points;
    const angle = (wrapped / points) * Math.PI * 2;
    return {
      x: 50 + Math.cos(angle) * radii[wrapped],
      y: 50 + Math.sin(angle) * radii[wrapped],
    };
  };

  // Closed cardinal spline: control points come from the neighbours, so the
  // outline stays smooth across the seam where it wraps.
  // Control arms are taken along the neighbours' chord, so the tension that
  // reproduces a circle depends on the point count: the arm wants to be
  // (4/3)·tan(π/2N)·r long, and the chord it is scaled from is 2·sin(2π/N)·r.
  // Guessing a constant here is what produces either a polygon (too short) or
  // scalloped bulges between the points (too long).
  const tension =
    ((4 / 3) * Math.tan(Math.PI / (2 * points))) / (2 * Math.sin((2 * Math.PI) / points));
  const segments = [`M ${point(0).x} ${point(0).y}`];
  for (let index = 0; index < points; index += 1) {
    const previous = point(index - 1);
    const from = point(index);
    const to = point(index + 1);
    const next = point(index + 2);
    segments.push(
      `C ${from.x + (to.x - previous.x) * tension} ${
        from.y + (to.y - previous.y) * tension
      }, ${to.x - (next.x - from.x) * tension} ${
        to.y - (next.y - from.y) * tension
      }, ${to.x} ${to.y}`,
    );
  }
  return `${segments.join(" ")} Z`;
};

/**
 * An organic blob that never settles: it travels a ring of generated shapes and
 * comes back to where it started, so the loop has no seam and the component
 * needs no entrance or exit to stay alive.
 *
 * It is an SVG shape, not a background — give it a colour and put it behind
 * something, or hand it to `svg-mask-reveal` as a mask.
 */
export const BlobMorph: React.FC<BlobMorphProps> = ({
  size = 260,
  fill = "#E8B86D",
  stroke,
  strokeWidth = 3,
  periodInFrames = 150,
  states = 4,
  points = 10,
  amplitude = 0.22,
  seed = 1,
  rotation = 12,
}) => {
  const frame = useCurrentFrame();

  const pairs = useMemo(
    () =>
      prepareMorphSequence(
        Array.from({ length: Math.max(2, states) }, (_, index) =>
          makeBlob(index, Math.max(5, points), amplitude, seed + index),
        ),
        // Closing the ring is what removes the seam: the last shape morphs back
        // into the first, so the wrap from 1 to 0 lands on the same geometry.
        { loop: true },
      ),
    [states, points, amplitude, seed],
  );

  // A plain wrapping ramp — no easing. Any easing here would put a stall at the
  // wrap point, which is exactly where a loop must be invisible.
  const cycle = (frame % periodInFrames) / periodInFrames;
  const d = morphSequence(cycle, pairs);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <g
        style={{
          transformOrigin: "50px 50px",
          // Driven by the raw frame, not the wrapping cycle: a rotation that
          // wrapped would snap back to zero on the frame the morph is at its
          // most seamless.
          rotate: `${(frame / periodInFrames) * rotation}deg`,
        }}
      >
        <path
          d={d}
          fill={fill ?? "none"}
          stroke={stroke}
          strokeWidth={stroke ? strokeWidth : undefined}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
