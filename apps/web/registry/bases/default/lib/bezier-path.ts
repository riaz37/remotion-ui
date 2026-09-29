import { parsePath, reduceInstructions } from "@remotion/paths";

/**
 * Paths as lists of cubic segments — the one representation every shape
 * operator in the motion lane reads and writes.
 *
 * AE's shape operators (trim, pucker, repeater…) all act on bézier vertices,
 * so a polyline representation would lose exactly the thing Pucker & Bloat
 * pulls on: the tangent handles. Lines are stored as cubics with handles on
 * the thirds, which keeps one code path and costs nothing visually.
 */

export type Pt = { x: number; y: number };

export type Segment = { p0: Pt; c1: Pt; c2: Pt; p1: Pt };

export type BezierPath = {
  segments: Segment[];
  closed: boolean;
};

const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export const lineSegment = (a: Pt, b: Pt): Segment => ({
  p0: a,
  c1: lerpPt(a, b, 1 / 3),
  c2: lerpPt(a, b, 2 / 3),
  p1: b,
});

// ------------------------------------------------------------- parse / write

/**
 * SVG `d` → bézier paths. `@remotion/paths` does the hard part: relative
 * commands, arcs, quadratics and shorthand all reduce to absolute M/L/C/Z.
 */
export function parseD(d: string): BezierPath[] {
  const instructions = reduceInstructions(parsePath(d));
  const paths: BezierPath[] = [];
  let current: BezierPath | null = null;
  let start: Pt = { x: 0, y: 0 };
  let cursor: Pt = { x: 0, y: 0 };

  const flush = () => {
    if (current && current.segments.length > 0) paths.push(current);
    current = null;
  };

  for (const ins of instructions) {
    if (ins.type === "M") {
      flush();
      start = { x: ins.x, y: ins.y };
      cursor = start;
      current = { segments: [], closed: false };
      continue;
    }
    if (!current) {
      current = { segments: [], closed: false };
      start = cursor;
    }
    const path: BezierPath = current;
    if (ins.type === "L") {
      const next = { x: ins.x, y: ins.y };
      path.segments.push(lineSegment(cursor, next));
      cursor = next;
    } else if (ins.type === "C") {
      const next = { x: ins.x, y: ins.y };
      path.segments.push({
        p0: cursor,
        c1: { x: ins.cp1x, y: ins.cp1y },
        c2: { x: ins.cp2x, y: ins.cp2y },
        p1: next,
      });
      cursor = next;
    } else if (ins.type === "Z") {
      if (Math.hypot(cursor.x - start.x, cursor.y - start.y) > 1e-6) {
        path.segments.push(lineSegment(cursor, start));
      }
      path.closed = true;
      cursor = start;
      flush();
    }
  }
  flush();
  return paths;
}

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? "0" : +n.toFixed(2)).toString();

export function toD(path: BezierPath): string {
  if (path.segments.length === 0) return "";
  const first = path.segments[0].p0;
  const parts = [`M${fmt(first.x)} ${fmt(first.y)}`];
  for (const s of path.segments) {
    parts.push(
      `C${fmt(s.c1.x)} ${fmt(s.c1.y)} ${fmt(s.c2.x)} ${fmt(s.c2.y)} ${fmt(s.p1.x)} ${fmt(s.p1.y)}`,
    );
  }
  if (path.closed) parts.push("Z");
  return parts.join("");
}

// ------------------------------------------------------------- evaluation

export function pointAt(s: Segment, u: number): Pt {
  const m = 1 - u;
  const a = m * m * m;
  const b = 3 * m * m * u;
  const c = 3 * m * u * u;
  const d = u * u * u;
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
  };
}

/** Unit tangent. Falls back to the chord where a handle sits on its vertex. */
export function tangentAt(s: Segment, u: number): Pt {
  const m = 1 - u;
  let x =
    3 * m * m * (s.c1.x - s.p0.x) + 6 * m * u * (s.c2.x - s.c1.x) + 3 * u * u * (s.p1.x - s.c2.x);
  let y =
    3 * m * m * (s.c1.y - s.p0.y) + 6 * m * u * (s.c2.y - s.c1.y) + 3 * u * u * (s.p1.y - s.c2.y);
  let length = Math.hypot(x, y);
  if (length < 1e-9) {
    x = s.p1.x - s.p0.x;
    y = s.p1.y - s.p0.y;
    length = Math.hypot(x, y) || 1;
  }
  return { x: x / length, y: y / length };
}

/** Split at `u` with de Casteljau — both halves are exact cubics. */
export function splitSegment(s: Segment, u: number): [Segment, Segment] {
  const a = lerpPt(s.p0, s.c1, u);
  const b = lerpPt(s.c1, s.c2, u);
  const c = lerpPt(s.c2, s.p1, u);
  const d = lerpPt(a, b, u);
  const e = lerpPt(b, c, u);
  const f = lerpPt(d, e, u);
  return [
    { p0: s.p0, c1: a, c2: d, p1: f },
    { p0: f, c1: e, c2: c, p1: s.p1 },
  ];
}

export function subSegment(s: Segment, u0: number, u1: number): Segment {
  if (u0 <= 0 && u1 >= 1) return s;
  const [, tail] = splitSegment(s, Math.max(0, u0));
  if (u1 >= 1) return tail;
  const local = u0 >= 1 ? 0 : (u1 - u0) / (1 - u0);
  return splitSegment(tail, local)[0];
}

// -------------------------------------------------------------- arc length

const TABLE_STEPS = 24;

/** Cumulative arc length at u = i / TABLE_STEPS. Cached per segment object. */
const tableCache = new WeakMap<Segment, Float64Array>();

function lengthTable(s: Segment): Float64Array {
  const cached = tableCache.get(s);
  if (cached) return cached;
  const table = new Float64Array(TABLE_STEPS + 1);
  let previous = s.p0;
  for (let i = 1; i <= TABLE_STEPS; i += 1) {
    const point = pointAt(s, i / TABLE_STEPS);
    table[i] = table[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  tableCache.set(s, table);
  return table;
}

export const segmentLength = (s: Segment) => lengthTable(s)[TABLE_STEPS];

export function pathLength(path: BezierPath): number {
  return path.segments.reduce((sum, s) => sum + segmentLength(s), 0);
}

/** Bézier parameter at an arc length along one segment. */
export function uAtLength(s: Segment, length: number): number {
  const table = lengthTable(s);
  const total = table[TABLE_STEPS];
  if (length <= 0 || total === 0) return 0;
  if (length >= total) return 1;
  let i = 1;
  while (i < TABLE_STEPS && table[i] < length) i += 1;
  const span = table[i] - table[i - 1];
  const within = span === 0 ? 0 : (length - table[i - 1]) / span;
  return (i - 1 + within) / TABLE_STEPS;
}

export type PathSample = Pt & { tangent: Pt; segment: number };

/** Point and tangent at an arc length along a whole path. */
export function sampleAtLength(path: BezierPath, length: number): PathSample {
  let remaining = Math.max(0, length);
  for (let i = 0; i < path.segments.length; i += 1) {
    const s = path.segments[i];
    const l = segmentLength(s);
    if (remaining <= l || i === path.segments.length - 1) {
      const u = uAtLength(s, remaining);
      return { ...pointAt(s, u), tangent: tangentAt(s, u), segment: i };
    }
    remaining -= l;
  }
  return { x: 0, y: 0, tangent: { x: 1, y: 0 }, segment: 0 };
}

// ------------------------------------------------------------------ slicing

/**
 * The part of a path between two arc lengths, as exact bézier pieces. The
 * range must already lie inside [0, length]; wrapping is the caller's call.
 */
export function slicePath(path: BezierPath, from: number, to: number): BezierPath {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const s of path.segments) {
    const l = segmentLength(s);
    const start = cursor;
    const end = cursor + l;
    cursor = end;
    if (end <= from || start >= to || l === 0) continue;
    const u0 = uAtLength(s, from - start);
    const u1 = uAtLength(s, to - start);
    if (u1 - u0 > 1e-6) segments.push(subSegment(s, u0, u1));
  }
  return { segments, closed: false };
}

/** Join two open pieces end to start — the seam of a wrapped closed path. */
export function joinPaths(a: BezierPath, b: BezierPath): BezierPath {
  return { segments: [...a.segments, ...b.segments], closed: false };
}

// ---------------------------------------------------------------- utilities

export function mapPoints(path: BezierPath, fn: (p: Pt) => Pt): BezierPath {
  return {
    closed: path.closed,
    segments: path.segments.map((s) => ({
      p0: fn(s.p0),
      c1: fn(s.c1),
      c2: fn(s.c2),
      p1: fn(s.p1),
    })),
  };
}

/** Mean of the vertices (not handles) — the pivot AE's path operators use. */
export function vertexCentroid(path: BezierPath): Pt {
  const vertices = path.segments.map((s) => s.p0);
  if (!path.closed && path.segments.length > 0) {
    vertices.push(path.segments[path.segments.length - 1].p1);
  }
  const n = Math.max(1, vertices.length);
  return {
    x: vertices.reduce((sum, p) => sum + p.x, 0) / n,
    y: vertices.reduce((sum, p) => sum + p.y, 0) / n,
  };
}

/**
 * Shoelace area of the vertex polygon, sampled along the curves. Positive
 * means the right-hand normal `(ty, -tx)` points outward — the sign the
 * offset operator needs to make a positive amount always grow the shape.
 */
export function signedArea(path: BezierPath): number {
  const points: Pt[] = [];
  for (const s of path.segments) {
    for (let i = 0; i < 8; i += 1) points.push(pointAt(s, i / 8));
  }
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/**
 * Catmull-Rom through points, as cubic segments — the "smooth" output of
 * zig-zag and wiggle paths. `tension` 1 is the standard centripetal-free form.
 */
export function smoothThrough(points: readonly Pt[], closed: boolean, tension = 1): BezierPath {
  const n = points.length;
  if (n < 2) return { segments: [], closed };
  const get = (i: number) =>
    closed ? points[((i % n) + n) % n] : points[Math.min(n - 1, Math.max(0, i))];
  const count = closed ? n : n - 1;
  const segments: Segment[] = [];
  for (let i = 0; i < count; i += 1) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const k = tension / 6;
    segments.push({
      p0: p1,
      c1: { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k },
      c2: { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k },
      p1: p2,
    });
  }
  return { segments, closed };
}

/** Straight lines through points — the "corner" output. */
export function polylineThrough(points: readonly Pt[], closed: boolean): BezierPath {
  const n = points.length;
  const segments: Segment[] = [];
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i += 1) {
    segments.push(lineSegment(points[i], points[(i + 1) % n]));
  }
  return { segments, closed };
}
