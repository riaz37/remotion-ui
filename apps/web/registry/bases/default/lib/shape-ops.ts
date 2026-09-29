import {
  applyToPoint,
  layerMatrix,
  noise3,
  resolveAnimatable,
  transformPower,
  type Animatable,
  type Mat2D,
  type Vec2,
} from "./ae-motion";
import {
  joinPaths,
  lineSegment,
  mapPoints,
  parseD,
  pathLength,
  pointAt,
  polylineThrough,
  sampleAtLength,
  segmentLength,
  signedArea,
  slicePath,
  smoothThrough,
  tangentAt,
  uAtLength,
  vertexCentroid,
  type BezierPath,
  type Pt,
  type Segment,
} from "./bezier-path";
import { fitPolyline } from "./curve-fit";

/**
 * An After Effects shape layer, as data: shapes at the top, then an ordered
 * stack of operators, each of which reads the geometry produced by everything
 * above it. Order is the whole point — a Trim below a Repeater draws across
 * the copies one after another; the same Trim above it draws every copy at
 * once. Neither is a special case here; they fall out of running the list.
 */

type A = Animatable<number>;
type AV = Animatable<Vec2>;

export type ShapeSource =
  | { type: "path"; d: string }
  | { type: "ellipse"; center?: AV; size: AV }
  | { type: "rect"; center?: AV; size: AV; roundness?: A }
  | {
      type: "star";
      center?: AV;
      points: A;
      outerRadius: A;
      innerRadius: A;
      rotation?: A;
      outerRoundness?: A;
      innerRoundness?: A;
    }
  | { type: "polygon"; center?: AV; points: A; radius: A; rotation?: A; roundness?: A };

export type TrimOp = {
  op: "trim";
  /** 0–1 along the path. */
  start?: A;
  end?: A;
  /** Turns: 1 = all the way round. Wraps on closed paths. */
  offset?: A;
  /** `individual` treats every path as one line, drawn in stack order. */
  mode?: "simultaneous" | "individual";
};

export type RepeaterOp = {
  op: "repeater";
  /** Fractional counts fade the last copy in, as in AE. */
  copies: A;
  /** Shifts every copy along the transform chain; animate it to crawl. */
  offset?: A;
  /** Pivot for rotation and scale. */
  anchor?: AV;
  /** Step between copies. */
  position?: AV;
  /** Scale factor per copy; compounds. */
  scale?: A;
  /** Degrees per copy; compounds. */
  rotation?: A;
  startOpacity?: A;
  endOpacity?: A;
  /** `below` stacks each new copy under the last (AE's default). */
  composite?: "above" | "below";
};

export type OffsetOp = {
  op: "offset";
  /** Pixels; positive grows a closed shape whichever way it winds. */
  amount: A;
  /** Concentric copies, each one `amount` further out. */
  copies?: number;
  /** Slides the copies outward by fractions of a step; animate for ripples. */
  copyOffset?: A;
  join?: "miter" | "round" | "bevel";
  miterLimit?: number;
};

export type WiggleOp = {
  op: "wiggle";
  /** Maximum displacement in pixels. */
  size: A;
  /** Points added per segment. */
  detail?: number;
  wigglesPerSecond?: A;
  /** 0 = every point on its own, 1 = the whole path moves as one. */
  correlation?: number;
  temporalPhase?: A;
  spatialPhase?: A;
  seed?: number;
  points?: "smooth" | "corner";
};

export type ZigZagOp = {
  op: "zigzag";
  size: A;
  /**
   * Extra points per segment. The original vertices move too, alternating
   * sides with the ridges, so 0 ridges still zig-zags the vertices (AE).
   */
  ridges?: A;
  points?: "corner" | "smooth";
};

export type PuckerBloatOp = {
  op: "pucker-bloat";
  /** -1 (pucker: vertices out, curves in) … 1 (bloat: vertices in, curves out). */
  amount: A;
};

export type TransformOp = {
  op: "transform";
  anchor?: AV;
  position?: AV;
  scale?: A;
  rotation?: A;
  opacity?: A;
};

export type ShapeOperator =
  | TrimOp
  | RepeaterOp
  | OffsetOp
  | WiggleOp
  | ZigZagOp
  | PuckerBloatOp
  | TransformOp;

/** One drawable path after the stack has run. */
export type ShapeItem = {
  path: BezierPath;
  opacity: number;
  /** Repeater copy index (0 when no repeater ran). */
  copy: number;
  /** Copies in the repeater that produced this item. */
  copies: number;
};

type Ctx = { frame: number; fps: number };

const num = (value: A | undefined, fallback: number, ctx: Ctx): number =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

const vec = (value: AV | undefined, fallback: Vec2, ctx: Ctx): Vec2 =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

// ------------------------------------------------------------------ shapes

/** Handle length that makes n evenly spaced vertices read as a circle. */
const CIRCLE_KAPPA = 0.5522847498;

function ellipse(center: Vec2, size: Vec2): BezierPath {
  const [cx, cy] = center;
  const rx = size[0] / 2;
  const ry = size[1] / 2;
  const kx = rx * CIRCLE_KAPPA;
  const ky = ry * CIRCLE_KAPPA;
  // Starts at the top and runs clockwise, like AE's ellipse path.
  const top = { x: cx, y: cy - ry };
  const right = { x: cx + rx, y: cy };
  const bottom = { x: cx, y: cy + ry };
  const left = { x: cx - rx, y: cy };
  return {
    closed: true,
    segments: [
      { p0: top, c1: { x: cx + kx, y: top.y }, c2: { x: right.x, y: cy - ky }, p1: right },
      { p0: right, c1: { x: right.x, y: cy + ky }, c2: { x: cx + kx, y: bottom.y }, p1: bottom },
      { p0: bottom, c1: { x: cx - kx, y: bottom.y }, c2: { x: left.x, y: cy + ky }, p1: left },
      { p0: left, c1: { x: left.x, y: cy - ky }, c2: { x: cx - kx, y: top.y }, p1: top },
    ],
  };
}

function rect(center: Vec2, size: Vec2, roundness: number): BezierPath {
  const [cx, cy] = center;
  const hw = size[0] / 2;
  const hh = size[1] / 2;
  const r = Math.max(0, Math.min(roundness, hw, hh));
  if (r === 0) {
    const corners = [
      { x: cx - hw, y: cy - hh },
      { x: cx + hw, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ];
    return polylineThrough(corners, true);
  }
  const k = r * CIRCLE_KAPPA;
  const l = cx - hw;
  const ri = cx + hw;
  const t = cy - hh;
  const b = cy + hh;
  const P = (x: number, y: number): Pt => ({ x, y });
  const arc = (p0: Pt, c1: Pt, c2: Pt, p1: Pt): Segment => ({ p0, c1, c2, p1 });
  return {
    closed: true,
    segments: [
      lineSegment(P(l + r, t), P(ri - r, t)),
      arc(P(ri - r, t), P(ri - r + k, t), P(ri, t + r - k), P(ri, t + r)),
      lineSegment(P(ri, t + r), P(ri, b - r)),
      arc(P(ri, b - r), P(ri, b - r + k), P(ri - r + k, b), P(ri - r, b)),
      lineSegment(P(ri - r, b), P(l + r, b)),
      arc(P(l + r, b), P(l + r - k, b), P(l, b - r + k), P(l, b - r)),
      lineSegment(P(l, b - r), P(l, t + r)),
      arc(P(l, t + r), P(l, t + r - k), P(l + r - k, t), P(l + r, t)),
    ],
  };
}

/**
 * Star and polygon share one builder: a ring of vertices, alternating radii
 * for a star, with tangential handles whose length is the circle handle
 * scaled by roundness — 1 reads as a circle, negative pinches.
 */
function radialPath(
  center: Vec2,
  radii: readonly number[],
  roundness: readonly number[],
  rotation: number,
): BezierPath {
  const n = radii.length;
  const step = (Math.PI * 2) / n;
  const handle = (4 / 3) * Math.tan(step / 4);
  const vertices = radii.map((radius, i) => {
    const angle = -Math.PI / 2 + (rotation * Math.PI) / 180 + i * step;
    return {
      point: { x: center[0] + Math.cos(angle) * radius, y: center[1] + Math.sin(angle) * radius },
      tangent: { x: -Math.sin(angle), y: Math.cos(angle) },
      length: radius * handle * roundness[i],
    };
  });
  const segments = vertices.map((v, i) => {
    const next = vertices[(i + 1) % n];
    return {
      p0: v.point,
      c1: { x: v.point.x + v.tangent.x * v.length, y: v.point.y + v.tangent.y * v.length },
      c2: {
        x: next.point.x - next.tangent.x * next.length,
        y: next.point.y - next.tangent.y * next.length,
      },
      p1: next.point,
    };
  });
  return { segments, closed: true };
}

const dCache = new Map<string, BezierPath[]>();

function parsedD(d: string): BezierPath[] {
  const cached = dCache.get(d);
  if (cached) return cached;
  const parsed = parseD(d);
  dCache.set(d, parsed);
  return parsed;
}

export function buildShape(source: ShapeSource, ctx: Ctx): BezierPath[] {
  switch (source.type) {
    case "path":
      return parsedD(source.d);
    case "ellipse":
      return [ellipse(vec(source.center, [0, 0], ctx), vec(source.size, [100, 100], ctx))];
    case "rect":
      return [
        rect(
          vec(source.center, [0, 0], ctx),
          vec(source.size, [100, 100], ctx),
          num(source.roundness, 0, ctx),
        ),
      ];
    case "star": {
      const points = Math.max(2, Math.round(num(source.points, 5, ctx)));
      const outer = num(source.outerRadius, 100, ctx);
      const inner = num(source.innerRadius, 50, ctx);
      const outerRound = num(source.outerRoundness, 0, ctx);
      const innerRound = num(source.innerRoundness, 0, ctx);
      const radii = Array.from({ length: points * 2 }, (_, i) => (i % 2 === 0 ? outer : inner));
      const round = radii.map((_, i) => (i % 2 === 0 ? outerRound : innerRound));
      return [radialPath(vec(source.center, [0, 0], ctx), radii, round, num(source.rotation, 0, ctx))];
    }
    case "polygon": {
      const points = Math.max(3, Math.round(num(source.points, 6, ctx)));
      const radius = num(source.radius, 100, ctx);
      const roundness = num(source.roundness, 0, ctx);
      return [
        radialPath(
          vec(source.center, [0, 0], ctx),
          Array.from({ length: points }, () => radius),
          Array.from({ length: points }, () => roundness),
          num(source.rotation, 0, ctx),
        ),
      ];
    }
    default:
      throw new Error(`shape-ops: unknown shape type "${(source as { type: string }).type}".`);
  }
}

// --------------------------------------------------------------- operators

/** Normalise a trim to a start in [0, 1) and a span in (0, 1]; null = nothing. */
function trimRange(start: number, end: number, offset: number): [number, number] | null {
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  const span = Math.min(1, e - s);
  if (span <= 1e-6) return null;
  const a = s + offset;
  return [a - Math.floor(a), span];
}

function trimOne(path: BezierPath, from: number, span: number): BezierPath[] {
  if (span >= 1 - 1e-9) return [path];
  const length = pathLength(path);
  const a = from * length;
  const b = (from + span) * length;
  if (b <= length) return [slicePath(path, a, b)];
  const head = slicePath(path, a, length);
  const tail = slicePath(path, 0, b - length);
  // A closed path's seam is not a real end: stitch the two pieces back into
  // one stroke so a line cap does not appear where the path starts.
  return path.closed ? [joinPaths(head, tail)] : [head, tail];
}

function applyTrim(items: ShapeItem[], op: TrimOp, ctx: Ctx): ShapeItem[] {
  const range = trimRange(num(op.start, 0, ctx), num(op.end, 1, ctx), num(op.offset, 0, ctx));
  if (!range) return [];
  const [from, span] = range;

  if ((op.mode ?? "simultaneous") === "simultaneous") {
    return items.flatMap((item) =>
      trimOne(item.path, from, span).map((path) => ({ ...item, path })),
    );
  }

  const lengths = items.map((item) => pathLength(item.path));
  const total = lengths.reduce((sum, l) => sum + l, 0);
  const windows: Array<[number, number]> = [];
  const a = from * total;
  const b = (from + span) * total;
  windows.push([a, Math.min(b, total)]);
  if (b > total) windows.push([0, b - total]);

  const out: ShapeItem[] = [];
  let cursor = 0;
  items.forEach((item, index) => {
    const start = cursor;
    const end = cursor + lengths[index];
    cursor = end;
    for (const [w0, w1] of windows) {
      const lo = Math.max(w0, start);
      const hi = Math.min(w1, end);
      if (hi - lo <= 1e-6) continue;
      if (lo <= start && hi >= end) out.push(item);
      else out.push({ ...item, path: slicePath(item.path, lo - start, hi - start) });
    }
  });
  return out;
}

function applyRepeater(items: ShapeItem[], op: RepeaterOp, ctx: Ctx): ShapeItem[] {
  const copies = Math.max(0, num(op.copies, 3, ctx));
  const whole = Math.ceil(copies - 1e-9);
  if (whole === 0) return [];
  const partial = copies - Math.floor(copies);
  const offset = num(op.offset, 0, ctx);
  const startOpacity = num(op.startOpacity, 1, ctx);
  const endOpacity = num(op.endOpacity, 1, ctx);
  const step = {
    anchor: vec(op.anchor, [0, 0], ctx),
    position: vec(op.position, [100, 0], ctx),
    scale: num(op.scale, 1, ctx),
    rotation: num(op.rotation, 0, ctx),
  };

  const copiesOut: ShapeItem[][] = [];
  for (let k = 0; k < whole; k += 1) {
    const matrix = transformPower(step, k + offset);
    const ramp = whole === 1 ? 0 : k / (whole - 1);
    let opacity = startOpacity + (endOpacity - startOpacity) * ramp;
    if (k === whole - 1 && partial > 1e-9) opacity *= partial;
    copiesOut.push(
      items.map((item) => ({
        path: transformPath(item.path, matrix),
        opacity: item.opacity * opacity,
        copy: k,
        copies: whole,
      })),
    );
  }
  const ordered = (op.composite ?? "below") === "below" ? copiesOut.reverse() : copiesOut;
  return ordered.flat();
}

export function transformPath(path: BezierPath, m: Mat2D): BezierPath {
  return mapPoints(path, (p) => {
    const [x, y] = applyToPoint(m, [p.x, p.y]);
    return { x, y };
  });
}

function applyPuckerBloat(items: ShapeItem[], op: PuckerBloatOp, ctx: Ctx): ShapeItem[] {
  const amount = num(op.amount, 0, ctx);
  if (amount === 0) return items;
  return items.map((item) => {
    const c = vertexCentroid(item.path);
    const toward = (p: Pt, t: number): Pt => ({ x: p.x + (c.x - p.x) * t, y: p.y + (c.y - p.y) * t });
    return {
      ...item,
      path: {
        closed: item.path.closed,
        segments: item.path.segments.map((s) => ({
          p0: toward(s.p0, amount),
          c1: toward(s.c1, -amount),
          c2: toward(s.c2, -amount),
          p1: toward(s.p1, amount),
        })),
      },
    };
  });
}

type Sample = Pt & { normal: Pt };

/**
 * `perSegment + 1` points per segment by arc length, vertices included, each
 * with its right-hand normal. The last vertex of an open path is appended.
 */
function subdivide(path: BezierPath, perSegment: number): Sample[] {
  const out: Sample[] = [];
  const n = Math.max(1, Math.round(perSegment));
  path.segments.forEach((s) => {
    const l = segmentLength(s);
    for (let k = 0; k < n; k += 1) {
      const u = uAtLength(s, (l * k) / n);
      const p = pointAt(s, u);
      const t = tangentAt(s, u);
      out.push({ ...p, normal: { x: t.y, y: -t.x } });
    }
  });
  if (!path.closed && path.segments.length > 0) {
    const last = path.segments[path.segments.length - 1];
    const t = tangentAt(last, 1);
    out.push({ ...last.p1, normal: { x: t.y, y: -t.x } });
  }
  return out;
}

type ZigPoint = { at: Pt; out: Pt; in: Pt };

/**
 * Zig Zag as AE and lottie-web draw it. Every original vertex moves along the
 * normal of the line through its neighbours, and `ridges` extra points sit at
 * even parameter steps along each segment, moving along the curve's normal;
 * the side alternates point by point across vertices and ridges alike, so
 * even 0 ridges zig-zags the vertices themselves. `smooth` gives each point
 * tangent handles a (2 * (ridges + 1))th of the neighbouring span.
 */
export function zigZagPath(path: BezierPath, size: number, ridges: number, smooth: boolean): BezierPath {
  if (path.segments.length === 0 || size === 0) return path;
  const vertices = path.segments.map((s) => s.p0);
  if (!path.closed) vertices.push(path.segments[path.segments.length - 1].p1);
  const n = vertices.length;
  const span = 2 * (ridges + 1);
  const points: ZigPoint[] = [];

  const place = (point: Pt, normal: Pt, tangent: Pt, side: number, outLength: number, inLength: number) => {
    const at = { x: point.x + normal.x * side * size, y: point.y + normal.y * side * size };
    points.push({
      at,
      out: { x: at.x + tangent.x * outLength, y: at.y + tangent.y * outLength },
      in: { x: at.x - tangent.x * inLength, y: at.y - tangent.y * inLength },
    });
  };
  const direction = (x: number, y: number): Pt => {
    const l = Math.hypot(x, y);
    return l < 1e-9 ? { x: 1, y: 0 } : { x: x / l, y: y / l };
  };

  const vertex = (index: number, side: number) => {
    const point = vertices[index % n];
    const prev = vertices[(index - 1 + n) % n];
    const next = vertices[(index + 1) % n];
    // Neighbours coincide at the ends of a two-point open path; fall back to
    // the path's own direction there.
    let t = direction(next.x - prev.x, next.y - prev.y);
    if (Math.hypot(next.x - prev.x, next.y - prev.y) < 1e-9) {
      const other = index === 0 ? vertices[1] : vertices[n - 2];
      t = index === 0 ? direction(other.x - point.x, other.y - point.y) : direction(point.x - other.x, point.y - other.y);
    }
    const normal = { x: t.y, y: -t.x };
    const toNext = smooth ? Math.hypot(next.x - point.x, next.y - point.y) : 0;
    const toPrev = smooth ? Math.hypot(point.x - prev.x, point.y - prev.y) : 0;
    place(point, normal, t, side, toNext / span, toPrev / span);
  };

  let side = -1;
  vertex(0, side);
  const count = path.closed ? n : n - 1;
  for (let k = 0; k < count; k += 1) {
    const segment = path.segments[k];
    const chord = smooth ? Math.hypot(segment.p1.x - segment.p0.x, segment.p1.y - segment.p0.y) / span : 0;
    for (let r = 0; r < ridges; r += 1) {
      side = -side;
      const u = (r + 1) / (ridges + 1);
      const t = tangentAt(segment, u);
      place(pointAt(segment, u), { x: t.y, y: -t.x }, t, side, chord, chord);
    }
    side = -side;
    // On a closed path this places vertex 0 a second time, on whichever side
    // the alternation has reached — as lottie-web does, so an odd point count
    // shows the same seam it shows in AE.
    vertex(k + 1, side);
  }

  const segments: Segment[] = [];
  const total = points.length;
  const links = path.closed ? total : total - 1;
  for (let i = 0; i < links; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % total];
    segments.push({ p0: a.at, c1: a.out, c2: b.in, p1: b.at });
  }
  return { segments, closed: path.closed };
}

function applyZigZag(items: ShapeItem[], op: ZigZagOp, ctx: Ctx): ShapeItem[] {
  const size = num(op.size, 10, ctx);
  const ridges = Math.max(0, Math.round(num(op.ridges, 5, ctx)));
  if (size === 0) return items;
  const smooth = (op.points ?? "corner") === "smooth";
  return items.map((item) => ({ ...item, path: zigZagPath(item.path, size, ridges, smooth) }));
}

function applyWiggle(items: ShapeItem[], op: WiggleOp, ctx: Ctx): ShapeItem[] {
  const size = num(op.size, 10, ctx);
  if (size === 0) return items;
  const wps = num(op.wigglesPerSecond, 2, ctx);
  const temporal = num(op.temporalPhase, 0, ctx);
  const spatial = num(op.spatialPhase, 0, ctx);
  const correlation = Math.min(1, Math.max(0, op.correlation ?? 0.5));
  const seed = Math.round(op.seed ?? 1);
  const time = (ctx.frame / ctx.fps) * wps + temporal;
  // Distance between neighbouring points in noise space.
  const spacing = (1 - correlation) * 0.6;

  return items.map((item, itemIndex) => {
    const samples = subdivide(item.path, (op.detail ?? 3) + 1);
    const n = samples.length;
    // Closed paths sample the noise around a circle, so the seam where the
    // path starts is as smooth as everywhere else.
    const radius = (n * spacing) / (Math.PI * 2);
    const points = samples.map((p, i) => {
      const X = item.path.closed ? Math.cos((i / n) * Math.PI * 2) * radius : i * spacing;
      const Y = item.path.closed ? Math.sin((i / n) * Math.PI * 2) * radius : 0;
      const channel = seed * 31 + itemIndex * 7;
      const dx = noise3(X + spatial, Y, time, channel);
      const dy = noise3(X + 41.3, Y + spatial, time, channel + 1);
      const k = 1.5 * size;
      return { x: p.x + Math.max(-1, Math.min(1, dx)) * k, y: p.y + Math.max(-1, Math.min(1, dy)) * k };
    });
    const path =
      (op.points ?? "smooth") === "smooth"
        ? smoothThrough(points, item.path.closed)
        : polylineThrough(points, item.path.closed);
    return { ...item, path };
  });
}

const FLATTEN_SPACING = 3;

/**
 * Dense polyline with the original vertices kept exact, for offsetting. A
 * closed path starts halfway along its first segment, so no corner sits on
 * the seam where loop removal cannot see across.
 */
function flatten(path: BezierPath, spacing = FLATTEN_SPACING): Pt[] {
  const points: Pt[] = [];
  path.segments.forEach((s) => {
    const l = segmentLength(s);
    const steps = Math.max(1, Math.min(96, Math.ceil(l / spacing)));
    for (let k = 0; k < steps; k += 1) points.push(pointAt(s, uAtLength(s, (l * k) / steps)));
  });
  if (!path.closed && path.segments.length > 0) {
    points.push(path.segments[path.segments.length - 1].p1);
  }
  const distinct = points.filter(
    (p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 1e-6,
  );
  if (!path.closed || path.segments.length === 0) return distinct;
  const firstSteps = Math.max(1, Math.min(96, Math.ceil(segmentLength(path.segments[0]) / spacing)));
  const shift = Math.floor(firstSteps / 2);
  return [...distinct.slice(shift), ...distinct.slice(0, shift)];
}

const unit = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

/** Intersection of segments ab and cd, strictly inside both, or null. */
function segmentIntersection(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denom;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denom;
  if (t <= 1e-9 || t >= 1 - 1e-9 || u <= 1e-9 || u >= 1 - 1e-9) return null;
  return { x: a.x + rx * t, y: a.y + ry * t };
}

function polygonArea(points: readonly Pt[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/**
 * Offsetting ties loops wherever the offset distance exceeds the local
 * radius: swallowtails at concave corners on the way out, and long ones at
 * acute tips on the way in. Every such loop winds the *opposite* way to the
 * path — that is what makes it an artefact rather than part of the shape —
 * so each crossing's loop is removed only if its winding is inverted. A loop
 * that winds the same way is a genuine island (an inset that pinches a shape
 * in two) and is left alone.
 *
 * Every segment pair is tested, with a bounding-box reject: a windowed search
 * missed the long loops at acute tips (a star inset by 20px kept all five).
 */
function removeInvertedLoops(points: readonly Pt[], closed: boolean): Pt[] {
  let out = [...points];
  const orientation = Math.sign(polygonArea(out)) || 1;
  let restarted = true;
  let guard = 0;
  while (restarted && guard < 256) {
    restarted = false;
    guard += 1;
    const n = out.length;
    const segments = closed ? n : n - 1;
    outer: for (let i = 0; i < segments; i += 1) {
      const a = out[i];
      const b = out[(i + 1) % n];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      for (let j = i + 2; j < segments; j += 1) {
        if (closed && i === 0 && j === n - 1) continue;
        const c = out[j];
        const d = out[(j + 1) % n];
        if (Math.max(c.x, d.x) < minX || Math.min(c.x, d.x) > maxX) continue;
        if (Math.max(c.y, d.y) < minY || Math.min(c.y, d.y) > maxY) continue;
        const hit = segmentIntersection(a, b, c, d);
        if (!hit) continue;
        // Collinear back-and-forth loops (square corners) have zero area, and
        // floating-point noise must not give them a winding to hide behind.
        const isArtefact = (loop: Pt[]) => {
          const area = polygonArea(loop);
          return Math.abs(area) < 0.5 || Math.sign(area) !== orientation;
        };
        const inner = [hit, ...out.slice(i + 1, j + 1)];
        if (isArtefact(inner)) {
          out = [...out.slice(0, i + 1), hit, ...out.slice(j + 1)];
          restarted = true;
          break outer;
        }
        // On a closed path the loop may be the other side of the crossing —
        // the one that runs across the seam where the point list starts.
        if (closed) {
          const across = [hit, ...out.slice(j + 1), ...out.slice(0, i + 1)];
          if (isArtefact(across)) {
            out = inner;
            restarted = true;
            break outer;
          }
        }
      }
    }
  }
  return out;
}

export function offsetPath(
  path: BezierPath,
  amount: number,
  join: "miter" | "round" | "bevel" = "miter",
  miterLimit = 4,
): BezierPath {
  if (amount === 0) return path;
  const points = flatten(path);
  const n = points.length;
  if (n < 2) return path;
  const d = path.closed && signedArea(path) < 0 ? -amount : amount;
  const out: Pt[] = [];
  const emit = (point: Pt) => out.push(point);

  for (let i = 0; i < n; i += 1) {
    const p = points[i];
    const hasPrev = path.closed || i > 0;
    const hasNext = path.closed || i < n - 1;
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const e1 = hasPrev ? unit(p.x - prev.x, p.y - prev.y) : unit(next.x - p.x, next.y - p.y);
    const e2 = hasNext ? unit(next.x - p.x, next.y - p.y) : e1;
    const n1 = { x: e1.y, y: -e1.x };
    const n2 = { x: e2.y, y: -e2.x };
    const bisector = unit(n1.x + n2.x, n1.y + n2.y);
    const cos = Math.max(1e-3, bisector.x * n1.x + bisector.y * n1.y);
    const miter = 1 / cos;
    const cross = e1.x * e2.y - e1.y * e2.x;
    const outer = cross !== 0 && cross > 0 === d > 0;
    const sign = d > 0 ? 1 : -1;

    if (!outer || miter <= (join === "miter" ? miterLimit : 1.02)) {
      const length = Math.min(miter, Math.max(miterLimit, 4));
      emit({ x: p.x + bisector.x * d * length, y: p.y + bisector.y * d * length });
      continue;
    }
    if (join === "round") {
      const a1 = Math.atan2(n1.y * sign, n1.x * sign);
      let a2 = Math.atan2(n2.y * sign, n2.x * sign);
      while (a2 - a1 > Math.PI) a2 -= Math.PI * 2;
      while (a1 - a2 > Math.PI) a2 += Math.PI * 2;
      const steps = Math.max(2, Math.ceil(Math.abs(a2 - a1) / 0.25));
      for (let k = 0; k <= steps; k += 1) {
        const a = a1 + ((a2 - a1) * k) / steps;
        emit({ x: p.x + Math.cos(a) * Math.abs(d), y: p.y + Math.sin(a) * Math.abs(d) });
      }
      continue;
    }
    emit({ x: p.x + n1.x * d, y: p.y + n1.y * d });
    emit({ x: p.x + n2.x * d, y: p.y + n2.y * d });
  }
  // Offsetting is exact on dense points; fitting brings the result back to a
  // few real bézier curves, and corner detection keeps miters and bevels sharp.
  return fitPolyline(removeInvertedLoops(out, path.closed), path.closed);
}

function applyOffset(items: ShapeItem[], op: OffsetOp, ctx: Ctx): ShapeItem[] {
  const amount = num(op.amount, 10, ctx);
  const copies = Math.max(1, Math.round(op.copies ?? 1));
  const shift = num(op.copyOffset, 0, ctx);
  return items.flatMap((item) =>
    Array.from({ length: copies }, (_, k) => ({
      ...item,
      // Rings are copies too: index them so colour ramps run across them,
      // unless a repeater above already numbered the geometry.
      ...(copies > 1 && item.copies <= 1 ? { copy: k, copies } : {}),
      path: offsetPath(item.path, amount * (k + (copies > 1 ? shift : 1)), op.join, op.miterLimit),
    })),
  );
}

function applyTransform(items: ShapeItem[], op: TransformOp, ctx: Ctx): ShapeItem[] {
  const matrix = layerMatrix({
    anchor: vec(op.anchor, [0, 0], ctx),
    position: vec(op.position, [0, 0], ctx),
    scale: num(op.scale, 1, ctx),
    rotation: num(op.rotation, 0, ctx),
  });
  const opacity = num(op.opacity, 1, ctx);
  return items.map((item) => ({
    ...item,
    path: transformPath(item.path, matrix),
    opacity: item.opacity * opacity,
  }));
}

export function applyOperator(items: ShapeItem[], operator: ShapeOperator, ctx: Ctx): ShapeItem[] {
  switch (operator.op) {
    case "trim":
      return applyTrim(items, operator, ctx);
    case "repeater":
      return applyRepeater(items, operator, ctx);
    case "offset":
      return applyOffset(items, operator, ctx);
    case "wiggle":
      return applyWiggle(items, operator, ctx);
    case "zigzag":
      return applyZigZag(items, operator, ctx);
    case "pucker-bloat":
      return applyPuckerBloat(items, operator, ctx);
    case "transform":
      return applyTransform(items, operator, ctx);
    default:
      throw new Error(`shape-ops: unknown operator "${(operator as { op: string }).op}".`);
  }
}

/** Run a whole shape layer: build the shapes, then every operator in order. */
export function evaluateShapeStack({
  shapes,
  operators = [],
  frame,
  fps = 30,
}: {
  shapes: readonly ShapeSource[];
  operators?: readonly ShapeOperator[];
  frame: number;
  fps?: number;
}): ShapeItem[] {
  const ctx = { frame, fps };
  const initial: ShapeItem[] = shapes.flatMap((shape) =>
    buildShape(shape, ctx).map((path) => ({ path, opacity: 1, copy: 0, copies: 1 })),
  );
  return operators.reduce<ShapeItem[]>(
    (items, operator) => applyOperator(items, operator, ctx),
    initial,
  );
}

/** A point riding the stack's output — for a spark on a trim head, etc. */
export function pointOnItem(item: ShapeItem, progress: number): Pt & { tangent: Pt } {
  const length = pathLength(item.path);
  const s = sampleAtLength(item.path, Math.min(1, Math.max(0, progress)) * length);
  return { x: s.x, y: s.y, tangent: s.tangent };
}
