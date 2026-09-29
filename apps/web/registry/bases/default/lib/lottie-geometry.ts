import type { Vec2 } from "./ae-motion";
import type { BezierPath, Segment } from "./bezier-path";

/**
 * Geometry for `lottie-shapes`, built exactly the way lottie-web builds it —
 * start vertex, direction and handle lengths included — because Trim Paths,
 * Zig Zag and Pucker & Bloat all read that layout.
 */

export type Direction = "clockwise" | "counter-clockwise";

// ------------------------------------------------------ parametric shapes

/** lottie-web's circle handle constant; keeps output identical to its player. */
const ROUND_CORNER = 0.5519;

type Triple = { v: Vec2; o: Vec2; i: Vec2 };

/** Absolute (vertex, out, in) triples → a closed bézier path. */
export function triplesToBezier(triples: readonly Triple[]): BezierPath {
  const n = triples.length;
  const segments: Segment[] = triples.map((t, k) => {
    const next = triples[(k + 1) % n];
    return {
      p0: { x: t.v[0], y: t.v[1] },
      c1: { x: t.o[0], y: t.o[1] },
      c2: { x: next.i[0], y: next.i[1] },
      p1: { x: next.v[0], y: next.v[1] },
    };
  });
  return { segments, closed: true };
}

const T = (vx: number, vy: number, ox: number, oy: number, ix: number, iy: number): Triple => ({
  v: [vx, vy],
  o: [ox, oy],
  i: [ix, iy],
});

/**
 * Rectangle as lottie-web builds it: the path starts on the right edge and
 * runs clockwise, or counter-clockwise when reversed. Where it starts is what
 * a Trim Paths on a rectangle measures from.
 */
export function rectPath(center: Vec2, size: Vec2, roundness: number, direction: Direction): BezierPath {
  const [p0, p1] = center;
  const v0 = size[0] / 2;
  const v1 = size[1] / 2;
  const r = Math.min(v0, v1, roundness);
  const c = r * (1 - ROUND_CORNER);
  if (direction === "clockwise") {
    if (r === 0) {
      return triplesToBezier([
        T(p0 + v0, p1 - v1, p0 + v0, p1 - v1, p0 + v0, p1 - v1),
        T(p0 + v0, p1 + v1, p0 + v0, p1 + v1, p0 + v0, p1 + v1),
        T(p0 - v0, p1 + v1, p0 - v0, p1 + v1, p0 - v0, p1 + v1),
        T(p0 - v0, p1 - v1, p0 - v0, p1 - v1, p0 - v0, p1 - v1),
      ]);
    }
    return triplesToBezier([
      T(p0 + v0, p1 - v1 + r, p0 + v0, p1 - v1 + r, p0 + v0, p1 - v1 + c),
      T(p0 + v0, p1 + v1 - r, p0 + v0, p1 + v1 - c, p0 + v0, p1 + v1 - r),
      T(p0 + v0 - r, p1 + v1, p0 + v0 - r, p1 + v1, p0 + v0 - c, p1 + v1),
      T(p0 - v0 + r, p1 + v1, p0 - v0 + c, p1 + v1, p0 - v0 + r, p1 + v1),
      T(p0 - v0, p1 + v1 - r, p0 - v0, p1 + v1 - r, p0 - v0, p1 + v1 - c),
      T(p0 - v0, p1 - v1 + r, p0 - v0, p1 - v1 + c, p0 - v0, p1 - v1 + r),
      T(p0 - v0 + r, p1 - v1, p0 - v0 + r, p1 - v1, p0 - v0 + c, p1 - v1),
      T(p0 + v0 - r, p1 - v1, p0 + v0 - c, p1 - v1, p0 + v0 - r, p1 - v1),
    ]);
  }
  if (r === 0) {
    return triplesToBezier([
      T(p0 + v0, p1 - v1, p0 + v0, p1 - v1, p0 + v0, p1 - v1),
      T(p0 - v0, p1 - v1, p0 - v0, p1 - v1, p0 - v0, p1 - v1),
      T(p0 - v0, p1 + v1, p0 - v0, p1 + v1, p0 - v0, p1 + v1),
      T(p0 + v0, p1 + v1, p0 + v0, p1 + v1, p0 + v0, p1 + v1),
    ]);
  }
  return triplesToBezier([
    T(p0 + v0, p1 - v1 + r, p0 + v0, p1 - v1 + c, p0 + v0, p1 - v1 + r),
    T(p0 + v0 - r, p1 - v1, p0 + v0 - r, p1 - v1, p0 + v0 - c, p1 - v1),
    T(p0 - v0 + r, p1 - v1, p0 - v0 + c, p1 - v1, p0 - v0 + r, p1 - v1),
    T(p0 - v0, p1 - v1 + r, p0 - v0, p1 - v1 + r, p0 - v0, p1 - v1 + c),
    T(p0 - v0, p1 + v1 - r, p0 - v0, p1 + v1 - c, p0 - v0, p1 + v1 - r),
    T(p0 - v0 + r, p1 + v1, p0 - v0 + r, p1 + v1, p0 - v0 + c, p1 + v1),
    T(p0 + v0 - r, p1 + v1, p0 + v0 - c, p1 + v1, p0 + v0 - r, p1 + v1),
    T(p0 + v0, p1 + v1 - r, p0 + v0, p1 + v1 - r, p0 + v0, p1 + v1 - c),
  ]);
}

/** Ellipse from the top, clockwise unless reversed — lottie-web's layout. */
export function ellipsePath(center: Vec2, size: Vec2, direction: Direction): BezierPath {
  const [p0, p1] = center;
  const s0 = size[0] / 2;
  const s1 = size[1] / 2;
  const cw = direction === "clockwise";
  const k = ROUND_CORNER;
  const x = (sign: number) => (cw ? p0 + sign * s0 : p0 - sign * s0);
  const xk = (sign: number) => (cw ? p0 + sign * s0 * k : p0 - sign * s0 * k);
  return triplesToBezier([
    T(p0, p1 - s1, xk(1), p1 - s1, xk(-1), p1 - s1),
    T(x(1), p1, x(1), p1 + s1 * k, x(1), p1 - s1 * k),
    T(p0, p1 + s1, xk(-1), p1 + s1, xk(1), p1 + s1),
    T(x(-1), p1, x(-1), p1 - s1 * k, x(-1), p1 + s1 * k),
  ]);
}

/** Star / polygon with lottie-web's tangent lengths for roundness. */
export function starPath(opts: {
  kind: "star" | "polygon";
  center: Vec2;
  points: number;
  outerRadius: number;
  innerRadius: number;
  outerRoundness: number;
  innerRoundness: number;
  rotation: number;
  direction: Direction;
}): BezierPath {
  const dir = opts.direction === "counter-clockwise" ? -1 : 1;
  const star = opts.kind === "star";
  const count = star ? Math.floor(opts.points) * 2 : Math.floor(opts.points);
  if (count < 1) return { segments: [], closed: true };
  const angle = (Math.PI * 2) / count;
  let current = -Math.PI / 2 + (opts.rotation * Math.PI) / 180;
  const triples: Triple[] = [];
  for (let k = 0; k < count; k += 1) {
    const long = !star || k % 2 === 0;
    const radius = long ? opts.outerRadius : opts.innerRadius;
    const roundness = long ? opts.outerRoundness : opts.innerRoundness;
    const perimeter = star ? (2 * Math.PI * radius) / (count * 2) : (2 * Math.PI * radius) / (count * 4);
    let x = radius * Math.cos(current);
    let y = radius * Math.sin(current);
    const len = Math.sqrt(x * x + y * y);
    const ox = len === 0 ? 0 : y / len;
    const oy = len === 0 ? 0 : -x / len;
    x += opts.center[0];
    y += opts.center[1];
    const h = perimeter * roundness * dir;
    triples.push(T(x, y, x - ox * h, y - oy * h, x + ox * h, y + oy * h));
    current += angle * dir;
  }
  return triplesToBezier(triples);
}


