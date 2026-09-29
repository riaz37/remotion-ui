import { resolveAnimatable, type Vec2 } from "./ae-motion";
import type {
  Color,
  EvalContext,
  FillItem,
  GradientFillItem,
  GradientStops,
  GradientStrokeItem,
  LineCap,
  LineJoin,
  Point,
  Scalar,
  StrokeItem,
} from "./lottie-shapes";

/**
 * Styles for `lottie-shapes`: fills, strokes and gradients resolved at a
 * frame into plain values, with lottie-web's colour and stop rounding.
 */

const num = (value: Scalar | undefined, fallback: number, ctx: EvalContext): number =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

const vec = (value: Point | undefined, fallback: Vec2, ctx: EvalContext): Vec2 =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

type StrokeProps = Pick<StrokeItem, "width" | "lineCap" | "lineJoin" | "miterLimit" | "dashes">;

/** CSS colour for a `Color` at a frame. Channels floor, as lottie-web does. */
export function resolveColor(color: Color, ctx: EvalContext): string {
  if (typeof color === "string") return color;
  const [r, g, b] = resolveAnimatable(color, ctx.frame, { fps: ctx.fps });
  const channel = (v: number) => Math.max(0, Math.min(255, Math.floor(v)));
  return `rgb(${channel(r)},${channel(g)},${channel(b)})`;
}

// ------------------------------------------------------------------ paints

export type ResolvedGradient = {
  kind: "linear" | "radial";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Radial only. */
  r: number;
  fx: number;
  fy: number;
  /** Offsets 0–1, CSS colours, opacity 0–1 — colour and alpha stops merged. */
  stops: readonly { offset: number; color: string; opacity: number }[];
};

export type ResolvedPaint = {
  mode: "fill" | "stroke";
  color: string | ResolvedGradient;
  opacity: number;
  fillRule: "nonzero" | "evenodd";
  width: number;
  lineCap: LineCap;
  lineJoin: LineJoin;
  miterLimit: number;
  dashArray: readonly number[] | null;
  dashOffset: number;
};

/**
 * Colour and alpha stops merged into one list. lottie-web draws alpha stops
 * through a separate mask gradient; interpolating both at the union of the
 * offsets gives the same ramp without the mask.
 */
export function resolveGradientStops(stops: GradientStops, ctx: EvalContext): ResolvedGradient["stops"] {
  const raw = resolveAnimatable(stops.values, ctx.frame, { fps: ctx.fps });
  const colors = Array.from({ length: stops.colorCount }, (_, k) => ({
    offset: Math.round(raw[k * 4] * 100) / 100,
    rgb: [raw[k * 4 + 1], raw[k * 4 + 2], raw[k * 4 + 3]].map((v) => Math.round(v * 255)),
  }));
  const alphas: { offset: number; alpha: number }[] = [];
  for (let k = stops.colorCount * 4; k + 1 < raw.length; k += 2) {
    alphas.push({ offset: Math.round(raw[k] * 100) / 100, alpha: raw[k + 1] });
  }
  const lerpAt = <V>(list: readonly { offset: number }[], offset: number, pick: (i: number) => V, mix: (a: V, b: V, t: number) => V): V => {
    if (offset <= list[0].offset) return pick(0);
    for (let k = 0; k < list.length - 1; k += 1) {
      const a = list[k].offset;
      const b = list[k + 1].offset;
      if (offset <= b) return mix(pick(k), pick(k + 1), b === a ? 1 : (offset - a) / (b - a));
    }
    return pick(list.length - 1);
  };
  const offsets = [...new Set([...colors.map((c) => c.offset), ...alphas.map((a) => a.offset)])].sort((a, b) => a - b);
  if (colors.length === 0) return [];
  return offsets.map((offset) => {
    const rgb = lerpAt(colors, offset, (i) => colors[i].rgb, (a, b, t) => a.map((v, i) => v + (b[i] - v) * t));
    const opacity =
      alphas.length === 0 ? 1 : lerpAt(alphas, offset, (i) => alphas[i].alpha, (a, b, t) => a + (b - a) * t);
    return { offset, color: `rgb(${rgb.map((v) => Math.round(v)).join(",")})`, opacity };
  });
}

function resolveGradient(item: GradientFillItem | GradientStrokeItem, ctx: EvalContext): ResolvedGradient {
  const [x1, y1] = vec(item.start, [0, 0], ctx);
  const [x2, y2] = vec(item.end, [100, 0], ctx);
  const r = Math.hypot(x1 - x2, y1 - y2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const highlight = Math.max(-0.99, Math.min(0.99, num(item.highlightLength, 0, ctx)));
  const focusAngle = angle + (num(item.highlightAngle, 0, ctx) * Math.PI) / 180;
  return {
    kind: item.kind,
    x1,
    y1,
    x2,
    y2,
    r,
    fx: Math.cos(focusAngle) * r * highlight + x1,
    fy: Math.sin(focusAngle) * r * highlight + y1,
    stops: resolveGradientStops(item.stops, ctx),
  };
}

export function resolvePaint(
  item: FillItem | StrokeItem | GradientFillItem | GradientStrokeItem,
  ctx: EvalContext,
): ResolvedPaint {
  const stroke = item.type === "stroke" || item.type === "gradient-stroke";
  const strokeProps = stroke ? (item as StrokeProps) : null;
  const dashes = strokeProps?.dashes;
  return {
    mode: stroke ? "stroke" : "fill",
    color:
      item.type === "fill" || item.type === "stroke"
        ? resolveColor(item.color, ctx)
        : resolveGradient(item, ctx),
    opacity: num(item.opacity, 1, ctx),
    fillRule: "fillRule" in item && item.fillRule ? item.fillRule : "nonzero",
    width: strokeProps ? num(strokeProps.width, 1, ctx) : 0,
    lineCap: strokeProps?.lineCap ?? "round",
    lineJoin: strokeProps?.lineJoin ?? "round",
    miterLimit: strokeProps?.miterLimit ?? 4,
    dashArray: dashes ? dashes.pattern.map((d) => num(d, 0, ctx)) : null,
    dashOffset: dashes ? num(dashes.offset, 0, ctx) : 0,
  };
}
