import type { BezierPath, Segment } from "./bezier-path";

/**
 * Offset Paths exactly as lottie-web computes it, for `lottie-shapes`.
 *
 * Each cubic segment is split at its inflection points and offset through its
 * control polygon (no flattening); neighbouring offset segments that cross are
 * cut back to their intersection, found by bounding-box subdivision; gaps are
 * closed with miter, round or bevel joins. The round join is lottie-web's own
 * (handles 2·r·0.5519 long), not a true circular arc — kept as is, because
 * this is what the reference player draws.
 *
 * `shape-ops`' `offsetPath` is a different algorithm (dense polyline + loop
 * removal) with its own strengths; this port exists so imported animations
 * match their Lottie preview.
 */

type P = [number, number];

const ROUND_CORNER = 0.5519;

const floatEqual = (a: number, b: number) => Math.abs(a - b) * 100000 <= Math.min(Math.abs(a), Math.abs(b));
const floatZero = (f: number) => Math.abs(f) <= 0.00001;
const pointEqual = (a: P, b: P) => floatEqual(a[0], b[0]) && floatEqual(a[1], b[1]);
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const lerpPoint = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const pointDistance = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polarOffset = (p: P, angle: number, length: number): P => [p[0] + Math.cos(angle) * length, p[1] - Math.sin(angle) * length];

function quadRoots(a: number, b: number, c: number): number[] {
  if (a === 0) return [];
  const s = b * b - 4 * a * c;
  if (s < 0) return [];
  const single = -b / (2 * a);
  if (s === 0) return [single];
  const delta = Math.sqrt(s) / (2 * a);
  return [single - delta, single + delta];
}

const coefficients = (p0: number, p1: number, p2: number, p3: number) => [-p0 + 3 * p1 - 3 * p2 + p3, 3 * p0 - 6 * p1 + 3 * p2, -3 * p0 + 3 * p1, p0];

class Bez {
  readonly points: [P, P, P, P];
  readonly a: P;
  readonly b: P;
  readonly c: P;
  readonly d: P;

  constructor(p0: P, p1: P, p2: P, p3: P, linearize = false) {
    // A handle sitting on its vertex has no direction; pull it onto the chord.
    const q1 = linearize && pointEqual(p0, p1) ? lerpPoint(p0, p3, 1 / 3) : p1;
    const q2 = linearize && pointEqual(p2, p3) ? lerpPoint(p0, p3, 2 / 3) : p2;
    const x = coefficients(p0[0], q1[0], q2[0], p3[0]);
    const y = coefficients(p0[1], q1[1], q2[1], p3[1]);
    this.a = [x[0], y[0]];
    this.b = [x[1], y[1]];
    this.c = [x[2], y[2]];
    this.d = [x[3], y[3]];
    this.points = [p0, q1, q2, p3];
  }

  point(t: number): P {
    return [((this.a[0] * t + this.b[0]) * t + this.c[0]) * t + this.d[0], ((this.a[1] * t + this.b[1]) * t + this.c[1]) * t + this.d[1]];
  }

  tangentAngle(t: number): number {
    const dx = (3 * t * this.a[0] + 2 * this.b[0]) * t + this.c[0];
    const dy = (3 * t * this.a[1] + 2 * this.b[1]) * t + this.c[1];
    return Math.atan2(dy, dx);
  }

  inflectionPoints(): number[] {
    const denom = this.a[1] * this.b[0] - this.a[0] * this.b[1];
    if (floatZero(denom)) return [];
    const cusp = (-0.5 * (this.a[1] * this.c[0] - this.a[0] * this.c[1])) / denom;
    const square = cusp * cusp - ((1 / 3) * (this.b[1] * this.c[0] - this.b[0] * this.c[1])) / denom;
    if (square < 0) return [];
    const root = Math.sqrt(square);
    if (floatZero(root)) return root > 0 && root < 1 ? [cusp] : [];
    return [cusp - root, cusp + root].filter((r) => r > 0 && r < 1);
  }

  split(t: number): [Bez, Bez] {
    const [p0, p1, p2, p3] = this.points;
    if (t <= 0) return [new Bez(p0, p0, p0, p0), this];
    if (t >= 1) return [this, new Bez(p3, p3, p3, p3)];
    const p10 = lerpPoint(p0, p1, t);
    const p11 = lerpPoint(p1, p2, t);
    const p12 = lerpPoint(p2, p3, t);
    const p20 = lerpPoint(p10, p11, t);
    const p21 = lerpPoint(p11, p12, t);
    const mid = lerpPoint(p20, p21, t);
    return [new Bez(p0, p10, p20, mid, true), new Bez(mid, p21, p12, p3, true)];
  }

  private extrema(axis: 0 | 1): { min: number; max: number } {
    let min = this.points[0][axis];
    let max = this.points[3][axis];
    if (min > max) [min, max] = [max, min];
    for (const r of quadRoots(3 * this.a[axis], 2 * this.b[axis], this.c[axis])) {
      if (r > 0 && r < 1) {
        const v = this.point(r)[axis];
        if (v < min) min = v;
        else if (v > max) max = v;
      }
    }
    return { min, max };
  }

  box(): { cx: number; cy: number; width: number; height: number } {
    const x = this.extrema(0);
    const y = this.extrema(1);
    return { cx: (x.max + x.min) / 2, cy: (y.max + y.min) / 2, width: x.max - x.min, height: y.max - y.min };
  }
}

type Box = { cx: number; cy: number; width: number; height: number; bez: Bez; t: number; t1: number; t2: number };

const boxOf = (bez: Bez, t1: number, t2: number): Box => ({ ...bez.box(), bez, t: (t1 + t2) / 2, t1, t2 });

function intersectsImpl(d1: Box, d2: Box, depth: number, found: [number, number][]): void {
  const overlap = Math.abs(d1.cx - d2.cx) * 2 < d1.width + d2.width && Math.abs(d1.cy - d2.cy) * 2 < d1.height + d2.height;
  if (!overlap) return;
  const tolerance = 2;
  if (depth >= 7 || (d1.width <= tolerance && d1.height <= tolerance && d2.width <= tolerance && d2.height <= tolerance)) {
    found.push([d1.t, d2.t]);
    return;
  }
  const [a0, a1] = d1.bez.split(0.5);
  const [b0, b1] = d2.bez.split(0.5);
  const s1 = [boxOf(a0, d1.t1, d1.t), boxOf(a1, d1.t, d1.t2)];
  const s2 = [boxOf(b0, d2.t1, d2.t), boxOf(b1, d2.t, d2.t2)];
  intersectsImpl(s1[0], s2[0], depth + 1, found);
  intersectsImpl(s1[0], s2[1], depth + 1, found);
  intersectsImpl(s1[1], s2[0], depth + 1, found);
  intersectsImpl(s1[1], s2[1], depth + 1, found);
}

function getIntersection(a: Bez, b: Bez): [number, number] | null {
  const found: [number, number][] = [];
  intersectsImpl(boxOf(a, 0, 1), boxOf(b, 0, 1), 0, found);
  if (found.length && floatEqual(found[0][0], 1)) found.shift();
  return found[0] ?? null;
}

function lineIntersection(s1: P, e1: P, s2: P, e2: P): P | null {
  const cross = (u: number[], v: number[]) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const r = cross(cross([s1[0], s1[1], 1], [e1[0], e1[1], 1]), cross([s2[0], s2[1], 1], [e2[0], e2[1], 1]));
  if (floatZero(r[2])) return null;
  return [r[0] / r[2], r[1] / r[2]];
}

function linearOffset(p1: P, p2: P, amount: number): [P, P] {
  const angle = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  return [polarOffset(p1, angle, amount), polarOffset(p2, angle, amount)];
}

function offsetSegment(segment: Bez, amount: number): Bez {
  const [p0, p1a] = linearOffset(segment.points[0], segment.points[1], amount);
  const [p1b, p2b] = linearOffset(segment.points[1], segment.points[2], amount);
  const [p2a, p3] = linearOffset(segment.points[2], segment.points[3], amount);
  const p1 = lineIntersection(p0, p1a, p1b, p2b) ?? p1a;
  const p2 = lineIntersection(p2a, p3, p1b, p2b) ?? p2a;
  return new Bez(p0, p1, p2, p3);
}

/** Split at inflections so each piece's control polygon is convex, then offset. */
function offsetSegmentSplit(segment: Bez, amount: number): Bez[] {
  const flex = segment.inflectionPoints();
  if (flex.length === 0) return [offsetSegment(segment, amount)];
  if (flex.length === 1 || floatEqual(flex[1], 1)) {
    const [left, right] = segment.split(flex[0]);
    return [offsetSegment(left, amount), offsetSegment(right, amount)];
  }
  const [left, rest] = segment.split(flex[0]);
  const [mid, right] = rest.split((flex[1] - flex[0]) / (1 - flex[0]));
  return [offsetSegment(left, amount), offsetSegment(mid, amount), offsetSegment(right, amount)];
}

function pruneSegmentIntersection(a: Bez[], b: Bez[]): [Bez[], Bez[]] {
  const outA = a.slice();
  const outB = b.slice();
  let hit = getIntersection(a[a.length - 1], b[0]);
  if (hit) {
    outA[a.length - 1] = a[a.length - 1].split(hit[0])[0];
    outB[0] = b[0].split(hit[1])[1];
  }
  if (a.length > 1 && b.length > 1) {
    hit = getIntersection(a[0], b[b.length - 1]);
    if (hit) return [[a[0].split(hit[0])[0]], [b[b.length - 1].split(hit[1])[1]]];
  }
  return [outA, outB];
}

function pruneIntersections(input: Bez[][]): Bez[][] {
  const segments = input.slice();
  for (let i = 1; i < segments.length; i += 1) {
    [segments[i - 1], segments[i]] = pruneSegmentIntersection(segments[i - 1], segments[i]);
  }
  if (segments.length > 1) {
    [segments[segments.length - 1], segments[0]] = pruneSegmentIntersection(segments[segments.length - 1], segments[0]);
  }
  return segments;
}

/** The output path as lottie-web builds it: vertices with in/out handles. */
type Vertex = { v: P; o: P; i: P };

function joinLines(out: Vertex[], seg1: Bez, seg2: Bez, join: LineJoinCode, miterLimit: number): P {
  const p0 = seg1.points[3];
  const p1 = seg2.points[0];
  if (join === 3) return p0;
  if (pointEqual(p0, p1)) return p0;
  if (join === 2) {
    const angleOut = -seg1.tangentAngle(1);
    const angleIn = -seg2.tangentAngle(0) + Math.PI;
    const center = lineIntersection(p0, polarOffset(p0, angleOut + Math.PI / 2, 100), p1, polarOffset(p1, angleOut + Math.PI / 2, 100));
    const radius = center ? pointDistance(center, p0) : pointDistance(p0, p1) / 2;
    out[out.length - 1] = { ...out[out.length - 1], o: polarOffset(p0, angleOut, 2 * radius * ROUND_CORNER) };
    out.push({ v: p1, o: p1, i: polarOffset(p1, angleIn, 2 * radius * ROUND_CORNER) });
    return p1;
  }
  const t0 = pointEqual(p0, seg1.points[2]) ? seg1.points[0] : seg1.points[2];
  const t1 = pointEqual(p1, seg2.points[1]) ? seg2.points[3] : seg2.points[1];
  const hit = lineIntersection(t0, p0, p1, t1);
  if (hit && pointDistance(hit, p0) < miterLimit) {
    out.push({ v: hit, o: hit, i: hit });
    return hit;
  }
  return p0;
}

/** Lottie's line join codes: 1 miter, 2 round, 3 bevel. */
export type LineJoinCode = 1 | 2 | 3;

export function lottieOffsetPath(path: BezierPath, amount: number, join: LineJoinCode, miterLimit: number): BezierPath {
  if (amount === 0 || path.segments.length === 0) return path;
  const toBez = (s: Segment) => new Bez([s.p0.x, s.p0.y], [s.c1.x, s.c1.y], [s.c2.x, s.c2.y], [s.p1.x, s.p1.y], true);
  const toBezReversed = (s: Segment) => new Bez([s.p1.x, s.p1.y], [s.c2.x, s.c2.y], [s.c1.x, s.c1.y], [s.p0.x, s.p0.y], true);
  let multi: Bez[][] = path.segments.map((s) => offsetSegmentSplit(toBez(s), amount));
  if (!path.closed) {
    // An open path is outlined: out along it, then back along the other side.
    multi = [...multi, ...[...path.segments].reverse().map((s) => offsetSegmentSplit(toBezReversed(s), amount))];
  }
  multi = pruneIntersections(multi);

  const out: Vertex[] = [];
  let lastPoint: P | null = null;
  let lastSeg: Bez | null = null;
  for (const group of multi) {
    if (lastSeg) lastPoint = joinLines(out, lastSeg, group[0], join, miterLimit);
    lastSeg = group[group.length - 1];
    for (const segment of group) {
      const [s0, s1, s2, s3] = segment.points;
      if (lastPoint && pointEqual(s0, lastPoint)) out[out.length - 1] = { ...out[out.length - 1], o: s1 };
      else out.push({ v: s0, o: s1, i: s0 });
      out.push({ v: s3, o: s3, i: s2 });
      lastPoint = s3;
    }
  }
  if (lastSeg && multi.length) joinLines(out, lastSeg, multi[0][0], join, miterLimit);

  const pt = (p: P) => ({ x: p[0], y: p[1] });
  const segments: Segment[] = out.slice(0, -1).map((vertex, k) => ({ p0: pt(vertex.v), c1: pt(vertex.o), c2: pt(out[k + 1].i), p1: pt(out[k + 1].v) }));
  if (path.closed && out.length > 1) {
    const last = out[out.length - 1];
    segments.push({ p0: pt(last.v), c1: pt(last.o), c2: pt(out[0].i), p1: pt(out[0].v) });
  }
  return { segments, closed: path.closed };
}
