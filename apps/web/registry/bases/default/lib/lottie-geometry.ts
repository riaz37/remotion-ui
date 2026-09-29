import type { Vec2 } from "./ae-motion";
import type { BezierPath, Pt, Segment } from "./bezier-path";

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


// ------------------------------------------------------------------ zig zag

/**
 * Zig Zag as AE and lottie-web draw it: the original vertices move too,
 * alternating sides along the projected normal, with `ridges` extra points
 * per segment at even parameter steps. `shape-ops`' zig-zag keeps vertices
 * fixed (so 0 ridges is a no-op there), which is a different effect — hence
 * this port.
 */
export function zigZagPath(path: BezierPath, amplitude: number, ridges: number, smooth: boolean): BezierPath {
  if (path.segments.length === 0 || amplitude === 0) return path;
  const vertices: Pt[] = path.segments.map((s) => s.p0);
  if (!path.closed) vertices.push(path.segments[path.segments.length - 1].p1);
  const length = vertices.length;
  const count = path.closed ? length : length - 1;
  const triples: Triple[] = [];

  const setPoint = (point: Pt, angle: number, direction: number, outAmp: number, inAmp: number) => {
    const px = point.x + Math.cos(angle) * direction * amplitude;
    const py = point.y - Math.sin(angle) * direction * amplitude;
    const angO = angle - Math.PI / 2;
    const angI = angle + Math.PI / 2;
    triples.push(
      T(px, py, px + Math.cos(angO) * outAmp, py - Math.sin(angO) * outAmp, px + Math.cos(angI) * inAmp, py - Math.sin(angI) * inAmp),
    );
  };
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const corner = (cur: number, direction: number) => {
    const prev = vertices[cur === 0 ? length - 1 : cur - 1];
    const next = vertices[(cur + 1) % length];
    // Perpendicular of prev→next, rotated −90°, as an angle measured lottie-web's way.
    const vx = next.x - prev.x;
    const vy = next.y - prev.y;
    const angle = -Math.atan2(-vx, vy);
    const point = vertices[cur % length];
    const prevDist = smooth ? dist(point, prev) : 0;
    const nextDist = smooth ? dist(point, vertices[(cur + 1) % length]) : 0;
    setPoint(point, angle, direction, nextDist / ((ridges + 1) * 2), prevDist / ((ridges + 1) * 2));
  };
  const segmentRidges = (s: Segment, startDirection: number): number => {
    // Degenerate handles are pulled onto the chord, as lottie-web linearises them.
    const c1 = s.c1.x === s.p0.x && s.c1.y === s.p0.y ? { x: s.p0.x + (s.p1.x - s.p0.x) / 3, y: s.p0.y + (s.p1.y - s.p0.y) / 3 } : s.c1;
    const c2 =
      s.c2.x === s.p1.x && s.c2.y === s.p1.y ? { x: s.p0.x + ((s.p1.x - s.p0.x) * 2) / 3, y: s.p0.y + ((s.p1.y - s.p0.y) * 2) / 3 } : s.c2;
    let direction = startDirection;
    const chord = smooth ? dist(s.p0, s.p1) : 0;
    for (let k = 0; k < ridges; k += 1) {
      const t = (k + 1) / (ridges + 1);
      const m = 1 - t;
      const point = {
        x: m * m * m * s.p0.x + 3 * m * m * t * c1.x + 3 * m * t * t * c2.x + t * t * t * s.p1.x,
        y: m * m * m * s.p0.y + 3 * m * m * t * c1.y + 3 * m * t * t * c2.y + t * t * t * s.p1.y,
      };
      const dx = 3 * m * m * (c1.x - s.p0.x) + 6 * m * t * (c2.x - c1.x) + 3 * t * t * (s.p1.x - c2.x);
      const dy = 3 * m * m * (c1.y - s.p0.y) + 6 * m * t * (c2.y - c1.y) + 3 * t * t * (s.p1.y - c2.y);
      setPoint(point, Math.atan2(dx, dy), direction, chord / ((ridges + 1) * 2), chord / ((ridges + 1) * 2));
      direction = -direction;
    }
    return direction;
  };

  let direction = -1;
  corner(0, direction);
  for (let k = 0; k < count; k += 1) {
    direction = segmentRidges(path.segments[k], -direction);
    corner(k + 1, direction);
  }
  const segments: Segment[] = triples.slice(0, -1).map((t, k) => {
    const next = triples[k + 1];
    return { p0: { x: t.v[0], y: t.v[1] }, c1: { x: t.o[0], y: t.o[1] }, c2: { x: next.i[0], y: next.i[1] }, p1: { x: next.v[0], y: next.v[1] } };
  });
  if (path.closed && triples.length > 1) {
    const last = triples[triples.length - 1];
    const first = triples[0];
    segments.push({ p0: { x: last.v[0], y: last.v[1] }, c1: { x: last.o[0], y: last.o[1] }, c2: { x: first.i[0], y: first.i[1] }, p1: { x: first.v[0], y: first.v[1] } });
  }
  return { segments, closed: path.closed };
}
