import type { BezierPath, Pt, Segment } from "./bezier-path";

/**
 * Fit cubic béziers through a polyline — Philip Schneider's algorithm from
 * Graphics Gems (1990): least-squares control points for a chord-length
 * parameterisation, Newton reparameterisation when the fit is close, and a
 * split at the worst point when it is not.
 *
 * Operators that are easiest to compute on dense points (offset, wiggle)
 * run through this on the way out, so what leaves them is a handful of real
 * curves with editable tangents rather than hundreds of straight lines.
 * Corners are detected first and never smoothed over: a miter stays a miter.
 */

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const unit = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};

function bezierPoint(s: Segment, t: number): Pt {
  const m = 1 - t;
  return {
    x: m * m * m * s.p0.x + 3 * m * m * t * s.c1.x + 3 * m * t * t * s.c2.x + t * t * t * s.p1.x,
    y: m * m * m * s.p0.y + 3 * m * m * t * s.c1.y + 3 * m * t * t * s.c2.y + t * t * t * s.p1.y,
  };
}

function chordParams(points: readonly Pt[]): number[] {
  const u = [0];
  for (let i = 1; i < points.length; i += 1) u.push(u[i - 1] + dist(points[i], points[i - 1]));
  const total = u[u.length - 1] || 1;
  return u.map((v) => v / total);
}

function generateBezier(points: readonly Pt[], u: readonly number[], t1: Pt, t2: Pt): Segment {
  const first = points[0];
  const last = points[points.length - 1];
  let c00 = 0;
  let c01 = 0;
  let c11 = 0;
  let x0 = 0;
  let x1 = 0;
  u.forEach((t, i) => {
    const m = 1 - t;
    const a1 = scale(t1, 3 * m * m * t);
    const a2 = scale(t2, 3 * m * t * t);
    c00 += dot(a1, a1);
    c01 += dot(a1, a2);
    c11 += dot(a2, a2);
    const base = add(scale(first, m * m * m + 3 * m * m * t), scale(last, 3 * m * t * t + t * t * t));
    const tmp = sub(points[i], base);
    x0 += dot(a1, tmp);
    x1 += dot(a2, tmp);
  });
  const det = c00 * c11 - c01 * c01;
  const chord = dist(first, last);
  let alpha1 = det === 0 ? 0 : (x0 * c11 - x1 * c01) / det;
  let alpha2 = det === 0 ? 0 : (c00 * x1 - c01 * x0) / det;
  // Degenerate or backwards handles: fall back to the Wu/Barsky heuristic.
  const epsilon = 1e-6 * chord;
  if (alpha1 < epsilon || alpha2 < epsilon) {
    alpha1 = chord / 3;
    alpha2 = chord / 3;
  }
  return {
    p0: first,
    c1: add(first, scale(t1, alpha1)),
    c2: add(last, scale(t2, alpha2)),
    p1: last,
  };
}

function maxError(points: readonly Pt[], s: Segment, u: readonly number[]): { error: number; index: number } {
  let error = 0;
  let index = Math.floor(points.length / 2);
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = dist(bezierPoint(s, u[i]), points[i]);
    if (d > error) {
      error = d;
      index = i;
    }
  }
  return { error, index };
}

/** One Newton step toward the parameter whose curve point is nearest `p`. */
function newton(s: Segment, p: Pt, t: number): number {
  const m = 1 - t;
  const q = bezierPoint(s, t);
  const d1 = {
    x: 3 * m * m * (s.c1.x - s.p0.x) + 6 * m * t * (s.c2.x - s.c1.x) + 3 * t * t * (s.p1.x - s.c2.x),
    y: 3 * m * m * (s.c1.y - s.p0.y) + 6 * m * t * (s.c2.y - s.c1.y) + 3 * t * t * (s.p1.y - s.c2.y),
  };
  const d2 = {
    x: 6 * m * (s.c2.x - 2 * s.c1.x + s.p0.x) + 6 * t * (s.p1.x - 2 * s.c2.x + s.c1.x),
    y: 6 * m * (s.c2.y - 2 * s.c1.y + s.p0.y) + 6 * t * (s.p1.y - 2 * s.c2.y + s.c1.y),
  };
  const diff = sub(q, p);
  const numerator = dot(diff, d1);
  const denominator = dot(d1, d1) + dot(diff, d2);
  if (Math.abs(denominator) < 1e-12) return t;
  return Math.min(1, Math.max(0, t - numerator / denominator));
}

function fitRun(points: readonly Pt[], t1: Pt, t2: Pt, tolerance: number, depth = 0): Segment[] {
  if (points.length === 2) {
    const l = dist(points[0], points[1]) / 3;
    return [{ p0: points[0], c1: add(points[0], scale(t1, l)), c2: add(points[1], scale(t2, l)), p1: points[1] }];
  }
  let u = chordParams(points);
  let s = generateBezier(points, u, t1, t2);
  let { error, index } = maxError(points, s, u);
  if (error <= tolerance) return [s];
  if (error <= tolerance * 4) {
    for (let i = 0; i < 6; i += 1) {
      u = u.map((t, k) => newton(s, points[k], t));
      s = generateBezier(points, u, t1, t2);
      ({ error, index } = maxError(points, s, u));
      if (error <= tolerance) return [s];
    }
  }
  if (depth > 24) return [s];
  const centre = unit(sub(points[index - 1], points[index + 1]));
  return [
    ...fitRun(points.slice(0, index + 1), t1, centre, tolerance, depth + 1),
    ...fitRun(points.slice(index), scale(centre, -1), t2, tolerance, depth + 1),
  ];
}

/** Turning angle at `i`, radians. */
function turn(prev: Pt, at: Pt, next: Pt): number {
  const a = unit(sub(at, prev));
  const b = unit(sub(next, at));
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
}

/**
 * Fit a polyline with cubic segments. Vertices that turn more than
 * `cornerDegrees` stay as corners; everything between is fitted to within
 * `tolerance` pixels.
 */
export function fitPolyline(
  input: readonly Pt[],
  closed: boolean,
  tolerance = 0.35,
  cornerDegrees = 32,
): BezierPath {
  const points = input.filter((p, i) => i === 0 || dist(p, input[i - 1]) > 1e-6);
  if (closed && points.length > 1 && dist(points[0], points[points.length - 1]) < 1e-6) points.pop();
  const n = points.length;
  if (n < 2) return { segments: [], closed };
  const threshold = (cornerDegrees * Math.PI) / 180;
  const corners: number[] = [];
  for (let i = 0; i < n; i += 1) {
    if (!closed && (i === 0 || i === n - 1)) continue;
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    if (turn(prev, points[i], next) > threshold) corners.push(i);
  }

  // Walk the path as runs between corners. A closed path is rotated to start
  // on a corner so no run straddles the seam; with none, it is one smooth loop.
  let ordered = points;
  let breaks: number[];
  if (closed) {
    const start = corners[0] ?? 0;
    ordered = [...points.slice(start), ...points.slice(0, start)];
    breaks = corners.map((c) => (c - start + n) % n).sort((a, b) => a - b);
    if (breaks[0] !== 0) breaks.unshift(0);
    ordered = [...ordered, ordered[0]];
    breaks.push(n);
  } else {
    breaks = [0, ...corners, n - 1];
  }
  const smoothLoop = closed && corners.length === 0;

  const segments: Segment[] = [];
  for (let r = 0; r < breaks.length - 1; r += 1) {
    const run = ordered.slice(breaks[r], breaks[r + 1] + 1);
    if (run.length < 2) continue;
    const last = run.length - 1;
    const t1 = smoothLoop
      ? unit(sub(ordered[1], ordered[ordered.length - 2]))
      : unit(sub(run[Math.min(1, last)], run[0]));
    const t2 = smoothLoop
      ? unit(sub(ordered[ordered.length - 2], ordered[1]))
      : unit(sub(run[Math.max(0, last - 1)], run[last]));
    segments.push(...fitRun(run, t1, t2, tolerance));
  }
  return { segments, closed };
}
