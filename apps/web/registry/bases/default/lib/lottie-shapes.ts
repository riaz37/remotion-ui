import {
  layerMatrix,
  multiply,
  resolveAnimatable,
  rotation,
  sampleTrack,
  scaling,
  translation,
  type Animatable,
  type KeyInterpolation,
  type KeyframeTrack,
  type Mat2D,
  type TemporalEase,
  type Vec2,
} from "./ae-motion";
import { toD, type BezierPath, type Pt, type Segment } from "./bezier-path";
import { applyOperator, offsetPath, transformPath, type ShapeItem as OpItem } from "./shape-ops";
import { ellipsePath, rectPath, starPath, zigZagPath, type Direction } from "./lottie-geometry";
import { resolvePaint, type ResolvedPaint } from "./lottie-paint";

export { ellipsePath, rectPath, starPath, zigZagPath, type Direction } from "./lottie-geometry";
export { resolveColor, resolveGradientStops, resolvePaint, type ResolvedGradient, type ResolvedPaint } from "./lottie-paint";

/**
 * The contents of an After Effects shape layer, as data — the shape of what
 * `remotion-ui import-ae` writes out of a Bodymovin/Lottie export.
 *
 * The evaluation follows AE's (and lottie-web's) stacking rules, which differ
 * from a plain operator list in three ways:
 *
 * - a **style** (fill, stroke, gradient) paints every path above it in its
 *   group, nested groups included, as one compound path;
 * - a **modifier** (trim, offset, zig-zag, pucker & bloat) reshapes every path
 *   above it, and every style that paints that path sees the result — even a
 *   style that sits above the modifier;
 * - a **repeater** clones everything above it, styles included, into copies.
 *
 * Every value is `Animatable`: a static value, an `ae-motion` keyframe track,
 * or an expression. Units follow `ae-motion`: frames, 0–1 proportions,
 * degrees, scale factors (1 = 100%). Colours are `#rrggbb` or `[r, g, b]` in
 * 0–255.
 */

// ------------------------------------------------------------------ values

export type Scalar = Animatable<number>;
export type Point = Animatable<Vec2>;
export type Rgb = readonly [number, number, number];
/** `#rrggbb`, or a track / expression of `[r, g, b]` in 0–255. */
export type Color = string | Animatable<Rgb>;

/** A bézier path the way AE stores it: tangents are relative to their vertex. */
export type PathShape = {
  closed: boolean;
  vertices: readonly Vec2[];
  inTangents: readonly Vec2[];
  outTangents: readonly Vec2[];
};

/**
 * A path keyframe. Easing uses AE's speed/influence, with speed measured in
 * "morphs per second": 1 is the whole change from this key to the next,
 * spread evenly over one second; 0 arrives or leaves flat.
 */
export type PathKeyframe = {
  frame: number;
  value: PathShape;
  easeIn?: TemporalEase;
  easeOut?: TemporalEase;
  interpolation?: KeyInterpolation;
};

export type PathValue = PathShape | readonly PathKeyframe[];


// ------------------------------------------------------------- content items

export type ContentTransform = {
  anchor?: Point;
  position?: Point;
  /** Factor per axis; [1, 1] = 100%. */
  scale?: Point;
  rotation?: Scalar;
  /** 0–1. */
  opacity?: Scalar;
  skew?: Scalar;
  skewAxis?: Scalar;
};

type Named = { name?: string; hidden?: boolean };

export type GroupItem = Named & {
  type: "group";
  items: readonly ContentItem[];
  transform?: ContentTransform;
};

export type PathItem = Named & { type: "path"; path: PathValue };

export type RectItem = Named & {
  type: "rect";
  position?: Point;
  size: Point;
  roundness?: Scalar;
  direction?: Direction;
};

export type EllipseItem = Named & {
  type: "ellipse";
  position?: Point;
  size: Point;
  direction?: Direction;
};

export type StarItem = Named & {
  type: "star";
  kind: "star" | "polygon";
  position?: Point;
  points: Scalar;
  outerRadius: Scalar;
  /** Star only. */
  innerRadius?: Scalar;
  /** 0–1. */
  outerRoundness?: Scalar;
  /** 0–1, star only. */
  innerRoundness?: Scalar;
  rotation?: Scalar;
  direction?: Direction;
};

export type LineCap = "butt" | "round" | "square";
export type LineJoin = "miter" | "round" | "bevel";

export type Dashes = {
  /** Alternating dash and gap lengths. */
  pattern: readonly Scalar[];
  offset?: Scalar;
};

type StrokeProps = {
  width: Scalar;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  miterLimit?: number;
  dashes?: Dashes;
};

export type FillItem = Named & {
  type: "fill";
  color: Color;
  /** 0–1. */
  opacity?: Scalar;
  fillRule?: "nonzero" | "evenodd";
};

export type StrokeItem = Named & StrokeProps & { type: "stroke"; color: Color; opacity?: Scalar };

/**
 * Gradient stops in Lottie's packed layout: `colorCount` groups of
 * `[offset, r, g, b]` (all 0–1), then optional `[offset, alpha]` pairs.
 * Build a static one with `gradientStops()`.
 */
export type GradientStops = { colorCount: number; values: Animatable<readonly number[]> };

type GradientProps = {
  kind: "linear" | "radial";
  start: Point;
  end: Point;
  /** Radial focus, -1…1 along the start→end axis. */
  highlightLength?: Scalar;
  /** Degrees. */
  highlightAngle?: Scalar;
  stops: GradientStops;
  opacity?: Scalar;
};

export type GradientFillItem = Named &
  GradientProps & { type: "gradient-fill"; fillRule?: "nonzero" | "evenodd" };

export type GradientStrokeItem = Named & GradientProps & StrokeProps & { type: "gradient-stroke" };

export type TrimItem = Named & {
  type: "trim";
  /** 0–1. */
  start?: Scalar;
  /** 0–1. */
  end?: Scalar;
  /** Degrees; 360 = once round. */
  offset?: Scalar;
  /** `individual` trims the paths one after another, top first. */
  mode?: "simultaneous" | "individual";
};

export type RepeaterItem = Named & {
  type: "repeater";
  /** Rounded up, as in lottie-web. */
  copies: Scalar;
  offset?: Scalar;
  /** `above`: copy 0 on top (Lottie `m: 1`). `below`: copy 0 at the bottom. */
  composite?: "above" | "below";
  transform?: {
    anchor?: Point;
    position?: Point;
    scale?: Point;
    rotation?: Scalar;
    /** 0–1. */
    startOpacity?: Scalar;
    /** 0–1. */
    endOpacity?: Scalar;
  };
};

export type OffsetPathItem = Named & {
  type: "offset-path";
  amount: Scalar;
  lineJoin?: LineJoin;
  miterLimit?: number;
};

export type ZigZagItem = Named & {
  type: "zig-zag";
  size: Scalar;
  ridges: Scalar;
  points?: "corner" | "smooth";
};

export type PuckerBloatItem = Named & {
  type: "pucker-bloat";
  /** -1 (pucker) … 1 (bloat). */
  amount: Scalar;
};

export type ContentItem =
  | GroupItem
  | PathItem
  | RectItem
  | EllipseItem
  | StarItem
  | FillItem
  | StrokeItem
  | GradientFillItem
  | GradientStrokeItem
  | TrimItem
  | RepeaterItem
  | OffsetPathItem
  | ZigZagItem
  | PuckerBloatItem;

// ------------------------------------------------------------ constructors

export const group = (
  name: string,
  items: readonly ContentItem[],
  transform?: ContentTransform,
): GroupItem => ({ type: "group", name, items, ...(transform ? { transform } : {}) });

export const path = (spec: Omit<PathItem, "type">): PathItem => ({ type: "path", ...spec });
export const rect = (spec: Omit<RectItem, "type">): RectItem => ({ type: "rect", ...spec });
export const ellipse = (spec: Omit<EllipseItem, "type">): EllipseItem => ({ type: "ellipse", ...spec });
export const star = (spec: Omit<StarItem, "type" | "kind">): StarItem => ({ type: "star", kind: "star", ...spec });
export const polygon = (spec: Omit<StarItem, "type" | "kind" | "innerRadius" | "innerRoundness">): StarItem => ({
  type: "star",
  kind: "polygon",
  ...spec,
});
export const fill = (spec: Omit<FillItem, "type">): FillItem => ({ type: "fill", ...spec });
export const stroke = (spec: Omit<StrokeItem, "type">): StrokeItem => ({ type: "stroke", ...spec });
export const gradientFill = (spec: Omit<GradientFillItem, "type">): GradientFillItem => ({
  type: "gradient-fill",
  ...spec,
});
export const gradientStroke = (spec: Omit<GradientStrokeItem, "type">): GradientStrokeItem => ({
  type: "gradient-stroke",
  ...spec,
});
export const trim = (spec: Omit<TrimItem, "type">): TrimItem => ({ type: "trim", ...spec });
export const repeater = (spec: Omit<RepeaterItem, "type">): RepeaterItem => ({ type: "repeater", ...spec });
export const offsetPathItem = (spec: Omit<OffsetPathItem, "type">): OffsetPathItem => ({
  type: "offset-path",
  ...spec,
});
export const zigZag = (spec: Omit<ZigZagItem, "type">): ZigZagItem => ({ type: "zig-zag", ...spec });
export const puckerBloat = (spec: Omit<PuckerBloatItem, "type">): PuckerBloatItem => ({
  type: "pucker-bloat",
  ...spec,
});

/** Static gradient stops from readable colour / opacity stops. */
export function gradientStops(
  colors: readonly { offset: number; color: string }[],
  opacities: readonly { offset: number; opacity: number }[] = [],
): GradientStops {
  const values = [
    ...colors.flatMap(({ offset, color }) => [offset, ...hexToUnit(color)]),
    ...opacities.flatMap(({ offset, opacity }) => [offset, opacity]),
  ];
  return { colorCount: colors.length, values };
}

// ------------------------------------------------------------- resolution

export type EvalContext = { frame: number; fps: number };

const num = (value: Scalar | undefined, fallback: number, ctx: EvalContext): number =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

const vec = (value: Point | undefined, fallback: Vec2, ctx: EvalContext): Vec2 =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

function hexToUnit(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) throw new Error(`lottie-shapes: "${hex}" is not a #rrggbb colour.`);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}


/**
 * The matrix of a Transform group — anchor, scale, skew, rotation, position,
 * in AE's order. lottie-web measures the skew axis the other way round from
 * `ae-motion`'s `layerMatrix`, so it is negated here to match its playback.
 */
export function transformMatrix(transform: ContentTransform | undefined, ctx: EvalContext): Mat2D {
  if (!transform) return [1, 0, 0, 1, 0, 0];
  return layerMatrix({
    anchor: vec(transform.anchor, [0, 0], ctx),
    position: vec(transform.position, [0, 0], ctx),
    scale: vec(transform.scale, [1, 1], ctx),
    rotation: num(transform.rotation, 0, ctx),
    skew: num(transform.skew, 0, ctx),
    skewAxis: -num(transform.skewAxis, 0, ctx),
  });
}

// ----------------------------------------------------------- path sampling

const progressCache = new WeakMap<object, { to: object; track: KeyframeTrack<number> }>();

/**
 * A path track at a frame. Vertices blend linearly; the blend amount runs
 * through an `ae-motion` track from 0 to 1, so the ease is AE's own curve.
 */
export function samplePath(value: PathValue, frame: number, fps: number): PathShape {
  if (!Array.isArray(value)) return value as PathShape;
  const keys = value as readonly PathKeyframe[];
  if (keys.length === 0) throw new Error("lottie-shapes: a path track needs at least one key.");
  if (frame <= keys[0].frame) return keys[0].value;
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return last.value;
  let index = 0;
  while (index < keys.length - 2 && frame >= keys[index + 1].frame) index += 1;
  const from = keys[index];
  const to = keys[index + 1];
  const mode = from.interpolation ?? "bezier";
  if (mode === "hold") return from.value;
  let progress = (frame - from.frame) / (to.frame - from.frame);
  if (mode === "bezier") {
    let cached = progressCache.get(from);
    if (!cached || cached.to !== to) {
      cached = {
        to,
        track: [
          { frame: from.frame, value: 0, ...(from.easeOut ? { easeOut: from.easeOut } : {}) },
          { frame: to.frame, value: 1, ...(to.easeIn ? { easeIn: to.easeIn } : {}) },
        ],
      };
      progressCache.set(from, cached);
    }
    progress = sampleTrack(cached.track, frame, { fps });
  }
  return blendPaths(from.value, to.value, progress);
}

function blendPaths(a: PathShape, b: PathShape, t: number): PathShape {
  const mix = (p: readonly Vec2[], q: readonly Vec2[]) =>
    p.map((v, i): Vec2 => {
      const w = q[i] ?? v;
      return [v[0] + (w[0] - v[0]) * t, v[1] + (w[1] - v[1]) * t];
    });
  return {
    closed: a.closed,
    vertices: mix(a.vertices, b.vertices),
    inTangents: mix(a.inTangents, b.inTangents),
    outTangents: mix(a.outTangents, b.outTangents),
  };
}

/** AE path data → cubic segments. A closed path gets its closing segment. */
export function pathShapeToBezier(shape: PathShape): BezierPath {
  const { vertices: v, inTangents: i, outTangents: o, closed } = shape;
  const n = v.length;
  const at = (k: number): Pt => ({ x: v[k][0], y: v[k][1] });
  const handle = (k: number, t: readonly Vec2[]): Pt => ({
    x: v[k][0] + (t[k]?.[0] ?? 0),
    y: v[k][1] + (t[k]?.[1] ?? 0),
  });
  const segment = (a: number, b: number): Segment => ({
    p0: at(a),
    c1: handle(a, o),
    c2: handle(b, i),
    p1: at(b),
  });
  const segments: Segment[] = [];
  for (let k = 0; k < n - 1; k += 1) segments.push(segment(k, k + 1));
  if (closed && n > 0) segments.push(segment(n - 1, 0));
  return { segments, closed };
}

function buildGeometry(item: PathItem | RectItem | EllipseItem | StarItem, ctx: EvalContext): BezierPath[] {
  switch (item.type) {
    case "path":
      return [pathShapeToBezier(samplePath(item.path, ctx.frame, ctx.fps))];
    case "rect":
      return [
        rectPath(
          vec(item.position, [0, 0], ctx),
          vec(item.size, [100, 100], ctx),
          num(item.roundness, 0, ctx),
          item.direction ?? "clockwise",
        ),
      ];
    case "ellipse":
      return [ellipsePath(vec(item.position, [0, 0], ctx), vec(item.size, [100, 100], ctx), item.direction ?? "clockwise")];
    case "star":
      return [
        starPath({
          kind: item.kind,
          center: vec(item.position, [0, 0], ctx),
          points: num(item.points, 5, ctx),
          outerRadius: num(item.outerRadius, 100, ctx),
          innerRadius: num(item.innerRadius, 50, ctx),
          outerRoundness: num(item.outerRoundness, 0, ctx),
          innerRoundness: num(item.innerRoundness, 0, ctx),
          rotation: num(item.rotation, 0, ctx),
          direction: item.direction ?? "clockwise",
        }),
      ];
    default:
      throw new Error(`lottie-shapes: unknown shape "${(item as { type: string }).type}".`);
  }
}

// --------------------------------------------------------------- modifiers

type Modifier = (shapes: readonly BezierPath[][]) => BezierPath[][];

const OP_CTX = { frame: 0, fps: 30 };

function toOpItems(paths: readonly BezierPath[], tag: number): OpItem[] {
  return paths.map((p) => ({ path: p, opacity: 1, copy: tag, copies: 1 }));
}

/**
 * Trim Paths with lottie-web's arithmetic: start and end clamp to 0–1, the
 * offset (degrees) shifts both, a shape's subpaths trim as one line, and
 * `individual` runs the window along every shape in stacking order.
 */
function trimModifier(item: TrimItem, ctx: EvalContext): Modifier {
  let o = (num(item.offset, 0, ctx) % 360) / 360;
  if (o < 0) o += 1;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  let s = clamp01(num(item.start, 0, ctx)) + o;
  let e = clamp01(num(item.end, 1, ctx)) + o;
  if (s > e) [s, e] = [e, s];
  s = Math.round(s * 10000) / 10000;
  e = Math.round(e * 10000) / 10000;
  return (shapes) => {
    if (e === s) return shapes.map(() => []);
    if ((e === 1 && s === 0) || (e === 0 && s === 1)) return shapes.map((p) => [...p]);
    const op = { op: "trim", start: s, end: e, mode: "individual" } as const;
    if (item.mode === "individual" && shapes.length > 1) {
      const out = applyOperator(shapes.flatMap(toOpItems), op, OP_CTX);
      return shapes.map((_, k) => out.filter((it) => it.copy === k).map((it) => it.path));
    }
    return shapes.map((paths) => applyOperator(toOpItems(paths, 0), op, OP_CTX).map((it) => it.path));
  };
}

const JOIN_BY_NAME: Record<LineJoin, "miter" | "round" | "bevel"> = { miter: "miter", round: "round", bevel: "bevel" };

function modifierFor(item: TrimItem | OffsetPathItem | ZigZagItem | PuckerBloatItem, ctx: EvalContext): Modifier {
  switch (item.type) {
    case "trim":
      return trimModifier(item, ctx);
    case "offset-path": {
      const amount = num(item.amount, 0, ctx);
      const join = JOIN_BY_NAME[item.lineJoin ?? "miter"];
      return (shapes) => shapes.map((paths) => paths.map((p) => offsetPath(p, amount, join, item.miterLimit ?? 4)));
    }
    case "zig-zag": {
      const size = num(item.size, 0, ctx);
      const ridges = Math.max(0, Math.round(num(item.ridges, 0, ctx)));
      const smooth = item.points === "smooth";
      return (shapes) => shapes.map((paths) => paths.map((p) => zigZagPath(p, size, ridges, smooth)));
    }
    case "pucker-bloat": {
      const op = { op: "pucker-bloat", amount: num(item.amount, 0, ctx) } as const;
      return (shapes) => shapes.map((paths) => applyOperator(toOpItems(paths, 0), op, OP_CTX).map((it) => it.path));
    }
    default:
      throw new Error(`lottie-shapes: unknown modifier "${(item as { type: string }).type}".`);
  }
}

// ----------------------------------------------------------- the resolved tree

/** `ghost`: contributes paths to styles below it but paints nothing (a repeater's originals). */
type RGroup = { k: "group"; matrix: Mat2D; opacity: number; items: readonly RNode[]; ghost?: boolean };
type RNode =
  | RGroup
  | { k: "shape"; paths: BezierPath[] }
  | { k: "paint"; paint: ResolvedPaint }
  | { k: "modifier"; apply: Modifier }
  | {
      k: "repeater";
      copies: number;
      offset: number;
      composite: "above" | "below";
      anchor: Vec2;
      position: Vec2;
      scale: Vec2;
      rotation: number;
      startOpacity: number;
      endOpacity: number;
    };

function resolveItems(items: readonly ContentItem[], ctx: EvalContext): RNode[] {
  return items.flatMap((item): RNode[] => {
    if (item.hidden) return [];
    switch (item.type) {
      case "group":
        return [
          {
            k: "group",
            matrix: transformMatrix(item.transform, ctx),
            opacity: num(item.transform?.opacity, 1, ctx),
            items: resolveItems(item.items, ctx),
          },
        ];
      case "path":
      case "rect":
      case "ellipse":
      case "star":
        return [{ k: "shape", paths: buildGeometry(item, ctx) }];
      case "fill":
      case "stroke":
      case "gradient-fill":
      case "gradient-stroke":
        return [{ k: "paint", paint: resolvePaint(item, ctx) }];
      case "trim":
      case "offset-path":
      case "zig-zag":
      case "pucker-bloat":
        return [{ k: "modifier", apply: modifierFor(item, ctx) }];
      case "repeater": {
        const tr = item.transform ?? {};
        return [
          {
            k: "repeater",
            copies: Math.max(0, Math.ceil(num(item.copies, 3, ctx))),
            offset: num(item.offset, 0, ctx),
            // lottie-web treats a missing composite like "below".
            composite: item.composite ?? "below",
            anchor: vec(tr.anchor, [0, 0], ctx),
            position: vec(tr.position, [0, 0], ctx),
            scale: vec(tr.scale, [1, 1], ctx),
            rotation: num(tr.rotation, 0, ctx),
            startOpacity: num(tr.startOpacity, 1, ctx),
            endOpacity: num(tr.endOpacity, 1, ctx),
          },
        ];
      }
      default:
        throw new Error(`lottie-shapes: unknown content item "${(item as { type: string }).type}".`);
    }
  });
}

const aboutAnchor = (m: Mat2D, anchor: Vec2): Mat2D =>
  multiply(translation(anchor[0], anchor[1]), multiply(m, translation(-anchor[0], -anchor[1])));

/**
 * Copy `steps` of a repeater, as lottie-web composes it: rotation and scale
 * about the anchor, then the position step — position does not curl with
 * rotation. Fractional steps blend scale linearly, as lottie-web does.
 */
export function repeaterMatrix(
  step: { anchor: Vec2; position: Vec2; scale: Vec2; rotation: number },
  steps: number,
): Mat2D {
  const whole = steps >= 0 ? Math.floor(steps) : Math.ceil(steps);
  const frac = steps - whole;
  const axis = (s: number) => {
    const partial = frac >= 0 ? 1 + (s - 1) * frac : 1 / (1 + (s - 1) * -frac);
    return s ** whole * partial;
  };
  const r = aboutAnchor(rotation(step.rotation * steps), step.anchor);
  const s = aboutAnchor(scaling(axis(step.scale[0]), axis(step.scale[1])), step.anchor);
  return multiply(translation(step.position[0] * steps, step.position[1] * steps), multiply(s, r));
}

/** Replace each repeater with its copies of everything above it. */
function expandRepeaters(nodes: readonly RNode[]): RNode[] {
  let list: RNode[] = nodes.map((n) => (n.k === "group" ? { ...n, items: expandRepeaters(n.items) } : n));
  for (let index = list.findIndex((n) => n.k === "repeater"); index >= 0; index = list.findIndex((n) => n.k === "repeater")) {
    const rep = list[index] as Extract<RNode, { k: "repeater" }>;
    const above = list.slice(0, index);
    const n = rep.copies;
    const copies: RGroup[] = Array.from({ length: n }, (_, i) => ({
      k: "group",
      matrix: repeaterMatrix(rep, rep.offset + (rep.composite === "above" ? i : n - 1 - i)),
      opacity: n === 1 ? rep.startOpacity : rep.startOpacity + (rep.endOpacity - rep.startOpacity) * (i / (n - 1)),
      items: above,
    }));
    // lottie-web keeps the originals in the list: their own styles stop drawing,
    // but their paths still reach every style below the repeater, so with a
    // non-zero offset the untransformed original shows alongside the copies.
    const originals: RGroup = { k: "group", matrix: [1, 0, 0, 1, 0, 0], opacity: 1, items: above, ghost: true };
    list = [...copies, originals, ...list.slice(index + 1)];
  }
  return list;
}

// ---------------------------------------------------------------- evaluate

/** What a shape layer draws at one frame, ready for SVG. */
export type RenderNode =
  | { kind: "group"; matrix: Mat2D; opacity: number; children: RenderNode[] }
  | { kind: "paint"; d: string; paint: ResolvedPaint };

type PaintRec = { paint: ResolvedPaint; depth: number; shapes: readonly number[] };
type Draw =
  | { kind: "group"; matrix: Mat2D; opacity: number; children: readonly Draw[] }
  | { kind: "paint"; rec: PaintRec };

/**
 * Evaluate shape-layer contents at a frame. Styles and modifiers are matched
 * to the paths above them, modifiers run inner-first then top to bottom, and
 * each style draws its paths in its own group's space.
 */
export function evaluateContents(items: readonly ContentItem[], ctx: EvalContext): RenderNode[] {
  const tree = expandRepeaters(resolveItems(items, ctx));
  // Repeater copies share node objects, so everything below is recorded per
  // occurrence in the walk, never keyed by node identity.
  const geometry: BezierPath[][] = [];
  const chains: (readonly Mat2D[])[] = [];
  const modifiers: { apply: Modifier; shapes: readonly number[] }[] = [];

  // Depth-first, top to bottom — the order modifiers apply in.
  const collect = (nodes: readonly RNode[], chain: readonly Mat2D[], ghost = false): { above: number[]; draws: Draw[] } => {
    const above: number[] = [];
    const draws: Draw[] = [];
    nodes.forEach((node) => {
      if (node.k === "group") {
        const inner = collect(node.items, [...chain, node.matrix], ghost || node.ghost === true);
        above.push(...inner.above);
        if (!ghost && !node.ghost) draws.push({ kind: "group", matrix: node.matrix, opacity: node.opacity, children: inner.draws });
      } else if (node.k === "shape") {
        above.push(geometry.length);
        geometry.push(node.paths);
        chains.push(chain);
      } else if (node.k === "modifier") {
        modifiers.push({ apply: node.apply, shapes: [...above] });
      } else if (node.k === "paint" && !ghost) {
        draws.push({ kind: "paint", rec: { paint: node.paint, depth: chain.length, shapes: [...above] } });
      }
    });
    return { above, draws };
  };
  const { draws } = collect(tree, []);

  for (const modifier of modifiers) {
    const result = modifier.apply(modifier.shapes.map((id) => geometry[id]));
    modifier.shapes.forEach((id, k) => {
      geometry[id] = result[k];
    });
  }

  const pathFor = (rec: PaintRec): string =>
    rec.shapes
      .map((id) => {
        const inner = chains[id].slice(rec.depth);
        const m = inner.reduce<Mat2D>((acc, g) => multiply(acc, g), [1, 0, 0, 1, 0, 0]);
        return geometry[id].map((p) => toD(inner.length ? transformPath(p, m) : p)).join("");
      })
      .join("");

  // Paint order: the bottom item of a group draws first.
  const build = (list: readonly Draw[]): RenderNode[] =>
    [...list].reverse().flatMap((draw): RenderNode[] => {
      if (draw.kind === "group") {
        return [{ kind: "group", matrix: draw.matrix, opacity: draw.opacity, children: build(draw.children) }];
      }
      const d = pathFor(draw.rec);
      return d ? [{ kind: "paint", d, paint: draw.rec.paint }] : [];
    });
  return build(draws);
}
