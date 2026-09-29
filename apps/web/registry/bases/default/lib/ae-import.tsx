import { createContext, useContext, useId, useMemo, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  cubicBezierAt,
  easeToCubicBezier,
  multiply,
  resolveAnimatable,
  toCssMatrix,
  type Animatable,
  type ExpressionContext,
  type Keyframe,
  type Mat2D,
  type Vec2,
} from "./ae-motion";
import {
  evaluateContents,
  transformMatrix,
  type ContentItem,
  type ContentTransform,
  type RenderNode,
  type ResolvedGradient,
  type Scalar,
} from "./lottie-shapes";

export * from "./lottie-shapes";

/**
 * The runtime behind `remotion-ui import-ae`: After Effects layers — shape,
 * solid, null and precomp — with parenting, in/out points, start offsets,
 * time stretch and time remap, drawn as one SVG per composition.
 *
 * Time is frame-driven end to end. `AeComposition` reads `useCurrentFrame()`
 * once; every layer evaluates its keyframes at that composition frame (Lottie
 * keyframe times are composition time), and a precomp hands its children its
 * own clock: shifted by its start time, stretched or remapped.
 */

// ------------------------------------------------------------------ clock

type AeClock = { frame: number; fps: number };

const AeTime = createContext<AeClock | null>(null);

/** The current composition's frame (fractional inside stretched precomps). */
export function useAeTime(): AeClock {
  const clock = useContext(AeTime);
  if (!clock) throw new Error("ae-import: layers must render inside <AeComposition>.");
  return clock;
}

// ----------------------------------------------------------------- layers

type LayerCommon = {
  name: string;
  /** The layer this one is parented to — AE's pick-whip. */
  parent?: Layer;
  /** Composition frame the layer appears on. */
  inPoint: number;
  /** Composition frame the layer is gone by (exclusive). */
  outPoint: number;
  transform?: ContentTransform;
  hidden?: boolean;
};

export type ShapeLayer = LayerCommon & { type: "shape"; contents: readonly ContentItem[] };
export type SolidLayer = LayerCommon & { type: "solid"; color: string; width: number; height: number };
export type NullLayer = LayerCommon & { type: "null" };
export type PrecompLayer = LayerCommon & {
  type: "precomp";
  /** Composition frame the precomp's own frame 0 lines up with. */
  startTime?: number;
  /** The precomp's own size; its content is clipped to it, as lottie-web does. */
  width: number;
  height: number;
  /** 2 = plays at half speed. Ignored when `timeRemap` is set. */
  timeStretch?: number;
  /** The precomp frame to show, keyed in composition frames. */
  timeRemap?: Scalar;
};
export type Layer = ShapeLayer | SolidLayer | NullLayer | PrecompLayer;

export const shapeLayer = (spec: Omit<ShapeLayer, "type">): ShapeLayer => ({ type: "shape", ...spec });
export const solidLayer = (spec: Omit<SolidLayer, "type">): SolidLayer => ({ type: "solid", ...spec });
export const nullLayer = (spec: Omit<NullLayer, "type">): NullLayer => ({ type: "null", ...spec });
export const precompLayer = (spec: Omit<PrecompLayer, "type">): PrecompLayer => ({ type: "precomp", ...spec });

/**
 * A layer's matrix in composition space: its parent chain's matrices times
 * its own, all at the same frame. Opacity is not inherited, as in AE.
 */
export function layerWorldMatrix(layer: Layer, compFrame: number, fps: number, trail: readonly Layer[] = []): Mat2D {
  if (trail.includes(layer)) {
    throw new Error(`ae-import: parenting cycle through "${layer.name}".`);
  }
  const local = transformMatrix(layer.transform, { frame: compFrame, fps });
  return layer.parent
    ? multiply(layerWorldMatrix(layer.parent, compFrame, fps, [...trail, layer]), local)
    : local;
}

// --------------------------------------------------------- property helpers

/** Separate Dimensions: X and Y animated on their own tracks. */
export const separate =
  (x: Scalar, y: Scalar) =>
  ({ frame, fps }: ExpressionContext): Vec2 => [
    resolveAnimatable(x, frame, { fps }),
    resolveAnimatable(y, frame, { fps }),
  ];

/** A vector whose channels ease independently (per-dimension graph curves). */
export const combine =
  <V extends readonly number[]>(...channels: Scalar[]) =>
  ({ frame, fps }: ExpressionContext): V =>
    channels.map((c) => resolveAnimatable(c, frame, { fps })) as unknown as V;

/**
 * A position key with spatial tangents — the handles of the motion path, in
 * pixels relative to this key's value.
 */
export type SpatialKeyframe = Keyframe<Vec2> & { spatialOut?: Vec2; spatialIn?: Vec2 };

type PolyPoint = { point: Vec2; distance: number };

const SPATIAL_SAMPLES = 150;
const spatialCache = new WeakMap<object, { to: object; points: PolyPoint[]; length: number }>();

function motionPath(from: SpatialKeyframe, to: SpatialKeyframe): { points: PolyPoint[]; length: number } {
  const cached = spatialCache.get(from);
  if (cached && cached.to === to) return cached;
  const a = from.value;
  const b = to.value;
  const c1: Vec2 = [a[0] + (from.spatialOut?.[0] ?? 0), a[1] + (from.spatialOut?.[1] ?? 0)];
  const c2: Vec2 = [b[0] + (to.spatialIn?.[0] ?? 0), b[1] + (to.spatialIn?.[1] ?? 0)];
  const points: PolyPoint[] = [];
  let length = 0;
  for (let k = 0; k < SPATIAL_SAMPLES; k += 1) {
    const u = k / (SPATIAL_SAMPLES - 1);
    const m = 1 - u;
    const point: Vec2 = [0, 1].map(
      (i) => m * m * m * a[i] + 3 * m * m * u * c1[i] + 3 * m * u * u * c2[i] + u * u * u * b[i],
    ) as unknown as Vec2;
    const prev = points[k - 1]?.point;
    const distance = prev ? Math.hypot(point[0] - prev[0], point[1] - prev[1]) : 0;
    length += distance;
    points.push({ point, distance });
  }
  const entry = { to, points, length };
  spatialCache.set(from, entry);
  return entry;
}

function sampleSpatial(keys: readonly SpatialKeyframe[], frame: number, fps: number): Vec2 {
  if (frame <= keys[0].frame) return keys[0].value;
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return last.value;
  let index = 0;
  while (index < keys.length - 2 && frame >= keys[index + 1].frame) index += 1;
  const from = keys[index];
  const to = keys[index + 1];
  const mode = from.interpolation ?? "bezier";
  if (mode === "hold") return from.value;
  const x = (frame - from.frame) / (to.frame - from.frame);
  const curve = mode === "bezier" ? easeToCubicBezier(from, to, fps) : null;
  const progress = curve ? cubicBezierAt(curve[0], curve[1], curve[2], curve[3], x) : x;
  const { points, length } = motionPath(from, to);
  // Arc length along the motion path, over the same 150-point polyline
  // lottie-web walks, so the ease is spread evenly along the curve.
  const target = length * progress;
  let walked = 0;
  for (let k = 1; k < points.length; k += 1) {
    const step = points[k].distance;
    if (target <= walked + step || k === points.length - 1) {
      const t = step === 0 ? 0 : Math.max(0, Math.min(1, (target - walked) / step));
      const p = points[k - 1].point;
      const q = points[k].point;
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    }
    walked += step;
  }
  return last.value;
}

/** A position that travels a curved motion path between its keys. */
export const spatial =
  (keys: readonly SpatialKeyframe[]) =>
  ({ frame, fps }: ExpressionContext): Vec2 =>
    sampleSpatial(keys, frame, fps);

// -------------------------------------------------------------- rendering

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

function GradientDef({ id, gradient }: { id: string; gradient: ResolvedGradient }) {
  const stops = gradient.stops.map((stop, index) => (
    <stop key={index} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity} />
  ));
  return gradient.kind === "linear" ? (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={gradient.x1} y1={gradient.y1} x2={gradient.x2} y2={gradient.y2}>
      {stops}
    </linearGradient>
  ) : (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={gradient.x1} cy={gradient.y1} r={gradient.r} fx={gradient.fx} fy={gradient.fy}>
      {stops}
    </radialGradient>
  );
}

function renderNodes(nodes: readonly RenderNode[], idBase: string, path: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${path}.${index}`;
    if (node.kind === "group") {
      return (
        <g key={key} transform={toCssMatrix(node.matrix)} opacity={node.opacity}>
          {renderNodes(node.children, idBase, key)}
        </g>
      );
    }
    const { paint } = node;
    const gradientId = typeof paint.color === "string" ? null : `${idBase}${key.replace(/\./g, "-")}`;
    const color = gradientId ? `url(#${gradientId})` : (paint.color as string);
    const isStroke = paint.mode === "stroke";
    return (
      <g key={key}>
        {gradientId ? <GradientDef id={gradientId} gradient={paint.color as ResolvedGradient} /> : null}
        <path
          d={node.d}
          fill={isStroke ? "none" : color}
          fillOpacity={isStroke ? undefined : paint.opacity}
          fillRule={paint.fillRule}
          stroke={isStroke ? color : "none"}
          strokeOpacity={isStroke ? paint.opacity : undefined}
          strokeWidth={isStroke ? paint.width : undefined}
          strokeLinecap={isStroke ? paint.lineCap : undefined}
          strokeLinejoin={isStroke ? paint.lineJoin : undefined}
          strokeMiterlimit={isStroke ? paint.miterLimit : undefined}
          strokeDasharray={isStroke && paint.dashArray ? paint.dashArray.join(" ") : undefined}
          strokeDashoffset={isStroke && paint.dashArray ? paint.dashOffset : undefined}
        />
      </g>
    );
  });
}

function ShapeContents({ items, frame, fps }: { items: readonly ContentItem[]; frame: number; fps: number }) {
  const idBase = `ae-${sanitizeId(useId())}`;
  const nodes = useMemo(() => evaluateContents(items, { frame, fps }), [items, frame, fps]);
  return <>{renderNodes(nodes, idBase, "g")}</>;
}

export type AeLayerProps = {
  layer: Layer;
  /** A precomp layer's contents: the precomp's own layers. */
  children?: ReactNode;
};

/** One AE layer. Renders nothing outside its in/out points or when hidden. */
export function AeLayer({ layer, children }: AeLayerProps) {
  const { frame: compFrame, fps } = useAeTime();
  const clipId = `ae-clip-${sanitizeId(useId())}`;
  if (layer.hidden || compFrame < layer.inPoint || compFrame >= layer.outPoint) return null;
  const matrix = toCssMatrix(layerWorldMatrix(layer, compFrame, fps));
  const opacity = resolveAnimatable(layer.transform?.opacity ?? 1, compFrame, { fps });

  let content: ReactNode = null;
  if (layer.type === "shape") {
    content = <ShapeContents items={layer.contents} frame={compFrame} fps={fps} />;
  } else if (layer.type === "solid") {
    content = <rect x={0} y={0} width={layer.width} height={layer.height} fill={layer.color} />;
  } else if (layer.type === "precomp") {
    const inner = layer.timeRemap
      ? resolveAnimatable(layer.timeRemap, compFrame, { fps })
      : (compFrame - (layer.startTime ?? 0)) / (layer.timeStretch ?? 1);
    content = (
      <>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={layer.width} height={layer.height} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <AeTime.Provider value={{ frame: inner, fps }}>{children}</AeTime.Provider>
        </g>
      </>
    );
  }

  return (
    <g transform={matrix} opacity={opacity} data-ae-layer={layer.name}>
      {content}
    </g>
  );
}

export type AeCompositionProps = {
  width: number;
  height: number;
  /** The export's frame rate; keyframe speeds are per second of it. */
  fps: number;
  /** The export's first frame (Lottie `ip`); Remotion frame 0 plays it. */
  startFrame?: number;
  background?: string;
  /** Layers, bottom of the AE timeline first — later children draw on top. */
  children: ReactNode;
};

/**
 * The root of an imported composition: one SVG scaled to fit the frame, and
 * the clock every layer below reads.
 */
export function AeComposition({ width, height, fps, startFrame = 0, background, children }: AeCompositionProps) {
  const frame = useCurrentFrame();
  const clock = useMemo(() => ({ frame: frame + startFrame, fps }), [frame, startFrame, fps]);
  return (
    <AbsoluteFill style={background ? { backgroundColor: background } : undefined}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
        <AeTime.Provider value={clock}>{children}</AeTime.Provider>
      </svg>
    </AbsoluteFill>
  );
}

export type { Animatable };
