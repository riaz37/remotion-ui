import {
  averageSpeed,
  easesFromHandles,
  handlesFor,
  isLinear,
  sameAcrossDimensions,
  type TemporalEase,
} from "./easing.js";
import { Call, commentSafe } from "./printer.js";
import { invalid, keyframeSchema, LIMITS, propertySchema, validate, type LottieKeyframe } from "./schema.js";

/**
 * Lottie animated properties → the values `ae-motion` reads: a static value,
 * a keyframe track, or a helper call (`spatial`, `separate`, `combine`). The
 * results are printer nodes, ready to be written as source.
 */

export type ImportIssue = {
  level: "unsupported" | "info";
  feature: string;
  /** Human-readable location: layer, group and property names. */
  where: string;
  /** JSON path into the source file. */
  path: string;
  detail: string;
};

export type ReadContext = {
  fps: number;
  issues: ImportIssue[];
  /** Keyframes read so far, checked against `LIMITS.keyframes`. */
  keyframeCount: { value: number };
};

export type Loc = { where: string; path: string };

export const at = (loc: Loc, where: string, path: string): Loc => ({
  where: where ? `${loc.where} › ${where}` : loc.where,
  path: `${loc.path}${path}`,
});

export function report(
  ctx: ReadContext,
  level: ImportIssue["level"],
  feature: string,
  loc: Loc,
  detail: string,
): void {
  ctx.issues.push({ level, feature, where: loc.where, path: loc.path, detail });
}

type NormalKey = {
  frame: number;
  value: number[];
  hold: boolean;
  o?: LottieKeyframe["o"];
  i?: LottieKeyframe["i"];
  to?: number[];
  ti?: number[];
};

type AeKey = {
  frame: number;
  value: unknown;
  easeIn?: TemporalEase;
  easeOut?: TemporalEase;
  interpolation?: "linear" | "hold";
  spatialIn?: number[];
  spatialOut?: number[];
};

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function numbers(value: unknown, loc: Loc): number[] {
  if (isFiniteNumber(value)) return [value];
  if (Array.isArray(value) && value.every(isFiniteNumber)) return value as number[];
  throw invalid(loc.path, `expected a number or an array of numbers, got ${JSON.stringify(value)?.slice(0, 60)}.`);
}

/** Lottie keeps a property either static in `k` or keyframed; tell which. */
export function isKeyframed(k: unknown): k is unknown[] {
  return (
    Array.isArray(k) &&
    k.length > 0 &&
    typeof k[0] === "object" &&
    k[0] !== null &&
    "t" in (k[0] as Record<string, unknown>)
  );
}

function checkExpression(prop: { x?: unknown }, ctx: ReadContext, loc: Loc): void {
  if (typeof prop.x === "string" && prop.x.trim() !== "") {
    report(
      ctx,
      "unsupported",
      "expression",
      loc,
      `AE expression ignored; the pre-expression value is used: ${commentSafe(prop.x).slice(0, 80)}`,
    );
  }
}

/**
 * Keyframes with old-format end values (`e`) resolved: every key gets its
 * own value, and the last key's value comes from the one before when it has
 * none — exactly what lottie-web reads (`nextKey.s || key.e`).
 */
function normalizeKeys(raw: unknown[], loc: Loc, read: (v: unknown, loc: Loc) => number[], ctx: ReadContext): NormalKey[] {
  ctx.keyframeCount.value += raw.length;
  if (ctx.keyframeCount.value > LIMITS.keyframes) {
    throw invalid(loc.path, `more than ${LIMITS.keyframes} keyframes in the file.`);
  }
  const keys = raw.map((k, index) => validate(keyframeSchema, k, `${loc.path}.k[${index}]`));
  return keys.map((key, index) => {
    const keyLoc = { ...loc, path: `${loc.path}.k[${index}]` };
    let value: number[];
    if (key.s !== undefined) value = read(key.s, { ...keyLoc, path: `${keyLoc.path}.s` });
    else if (index > 0 && keys[index - 1].e !== undefined) {
      value = read(keys[index - 1].e, { ...keyLoc, path: `${loc.path}.k[${index - 1}].e` });
    } else throw invalid(keyLoc.path, "keyframe has no value (`s`) and no previous end value (`e`).");
    return {
      frame: key.t,
      value,
      hold: key.h === 1,
      o: key.o,
      i: key.i,
      to: key.to,
      ti: key.ti,
    };
  });
}

const nonZero = (v: readonly number[] | undefined) => !!v && v.some((n) => Math.abs(n) > 1e-9);

/**
 * `ae-motion` keys for one dimension set. `dimension` picks which handle
 * pair to use when Lottie stores one curve per dimension.
 */
function toAeKeys(keys: NormalKey[], fps: number, pickValue: (v: number[]) => number[], dimension: number, spatialMode: boolean): AeKey[] {
  const values = keys.map((k) => pickValue(k.value));
  const eases = keys.map(() => ({}) as { easeIn?: TemporalEase; easeOut?: TemporalEase; interpolation?: "linear" | "hold" });
  for (let k = 0; k < keys.length - 1; k += 1) {
    const seconds = (keys[k + 1].frame - keys[k].frame) / fps;
    if (keys[k].hold || seconds <= 0) {
      eases[k].interpolation = "hold";
      continue;
    }
    const h = handlesFor(keys[k].o, keys[k].i, spatialMode ? 0 : dimension);
    if (isLinear(h)) {
      eases[k].interpolation = "linear";
      continue;
    }
    const { easeOut, easeIn } = easesFromHandles(h, averageSpeed(values[k], values[k + 1], seconds));
    eases[k].easeOut = easeOut;
    eases[k + 1].easeIn = easeIn;
  }
  return keys.map((key, k) => {
    const value = values[k].length === 1 ? values[k][0] : values[k];
    const out: AeKey = { frame: key.frame, value, ...eases[k] };
    if (spatialMode) {
      const spatialOut = key.to?.slice(0, 2);
      const spatialIn = keys[k - 1]?.ti?.slice(0, 2);
      if (nonZero(spatialIn)) out.spatialIn = spatialIn;
      if (nonZero(spatialOut) && k < keys.length - 1) out.spatialOut = spatialOut;
    }
    return orderKey(out);
  });
}

/** Key fields in reading order: when, what, how it arrives, how it leaves. */
function orderKey(key: AeKey): AeKey {
  const { frame, value, easeIn, easeOut, interpolation, spatialIn, spatialOut } = key;
  return { frame, value, easeIn, easeOut, interpolation, spatialIn, spatialOut };
}

export type ReadOptions = {
  /** Multiplier from Lottie units to `ae-motion` units (0.01 for percent). */
  scale?: number;
  /** Dimensions to keep (drops the z of 2D layers). */
  dims?: number;
  /** Position-like: honours spatial tangents. */
  spatial?: boolean;
};

function readNumeric(prop: unknown, ctx: ReadContext, loc: Loc, options: ReadOptions): unknown {
  const { scale = 1, dims = 1, spatial = false } = options;
  const p = validate(propertySchema, prop, loc.path);
  checkExpression(p, ctx, loc);
  const read = (v: unknown, l: Loc) => numbers(v, l).slice(0, dims).map((n) => n * scale);

  if (!isKeyframed(p.k)) {
    const value = read(p.k, { ...loc, path: `${loc.path}.k` });
    if (value.length < dims) throw invalid(`${loc.path}.k`, `expected ${dims} values, got ${value.length}.`);
    return dims === 1 ? value[0] : value;
  }

  const keys = normalizeKeys(p.k, loc, read, ctx);
  keys.forEach((k, index) => {
    if (k.value.length < dims) throw invalid(`${loc.path}.k[${index}]`, `expected ${dims} values, got ${k.value.length}.`);
  });
  if (keys.length === 1) return dims === 1 ? keys[0].value[0] : keys[0].value;

  const spatialMode = spatial && keys.some((k) => nonZero(k.to) || nonZero(k.ti));
  const perDimension =
    !spatialMode && dims > 1 && keys.some((k) => !k.hold && !sameAcrossDimensions(k.o, k.i, dims));

  if (perDimension) {
    // One curve per dimension: split into scalar tracks, each with its own ease.
    const channels = Array.from({ length: dims }, (_, d) => toAeKeys(keys, ctx.fps, (v) => [v[d]], d, false));
    return dims === 2 ? new Call("separate", channels) : new Call("combine", channels);
  }
  const track = toAeKeys(keys, ctx.fps, (v) => v, 0, spatialMode);
  return spatialMode ? new Call("spatial", [track]) : track;
}

/** A scalar property, e.g. rotation or opacity. */
export const readScalar = (prop: unknown, ctx: ReadContext, loc: Loc, scale = 1) =>
  readNumeric(prop, ctx, loc, { scale, dims: 1 });

/** A 2D vector property, e.g. anchor, size or scale. */
export const readVector = (prop: unknown, ctx: ReadContext, loc: Loc, scale = 1) =>
  readNumeric(prop, ctx, loc, { scale, dims: 2 });

/** Position: spatial tangents, or Separate Dimensions (`s: true`). */
export function readPosition(prop: unknown, ctx: ReadContext, loc: Loc): unknown {
  if (prop && typeof prop === "object" && (prop as Record<string, unknown>).s === true) {
    // Separate Dimensions carries `x` and `y` instead of `k`.
    const record = prop as Record<string, unknown>;
    if (record.x === undefined || record.y === undefined) {
      throw invalid(loc.path, "separated position needs `x` and `y`.");
    }
    return new Call("separate", [
      readScalar(record.x, ctx, at(loc, "X Position", ".x")),
      readScalar(record.y, ctx, at(loc, "Y Position", ".y")),
    ]);
  }
  return readNumeric(prop, ctx, loc, { dims: 2, spatial: true });
}

/** Lottie colours are 0–1 floats; lottie-web floors `value × 255`. */
export function unitToHex(values: readonly number[]): string {
  const channel = (v: number) => Math.max(0, Math.min(255, Math.floor(v * 255)));
  return `#${values
    .slice(0, 3)
    .map((v) => channel(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Colour: a `#rrggbb` string, or a track of `[r, g, b]` in 0–255. */
export function readColor(prop: unknown, ctx: ReadContext, loc: Loc): unknown {
  const p = validate(propertySchema, prop, loc.path);
  if (!isKeyframed(p.k)) {
    checkExpression(p, ctx, loc);
    const value = numbers(p.k, { ...loc, path: `${loc.path}.k` });
    if (value.length < 3) throw invalid(`${loc.path}.k`, "a colour needs at least 3 channels.");
    return unitToHex(value);
  }
  return readNumeric(prop, ctx, loc, { scale: 255, dims: 3 });
}

/** A static value from a property that `ae-motion` can only take as a number. */
export function readStaticNumber(prop: unknown, ctx: ReadContext, loc: Loc, feature: string): number {
  if (isFiniteNumber(prop)) return prop;
  const p = validate(propertySchema, prop, loc.path);
  checkExpression(p, ctx, loc);
  if (!isKeyframed(p.k)) return numbers(p.k, { ...loc, path: `${loc.path}.k` })[0];
  report(ctx, "unsupported", `animated ${feature}`, loc, `${feature} cannot be animated here; the first keyframe's value is used.`);
  const first = validate(keyframeSchema, p.k[0], `${loc.path}.k[0]`);
  return numbers(first.s ?? first.e, { ...loc, path: `${loc.path}.k[0].s` })[0];
}

/** Gradient stops, kept in Lottie's packed layout. */
export function readGradient(g: unknown, ctx: ReadContext, loc: Loc): unknown {
  if (!g || typeof g !== "object") throw invalid(loc.path, "gradient needs `g`.");
  const record = g as Record<string, unknown>;
  const count = record.p;
  if (!isFiniteNumber(count) || count < 1 || count > 1000 || !Number.isInteger(count)) {
    throw invalid(`${loc.path}.p`, "gradient colour count must be a positive integer.");
  }
  const p = validate(propertySchema, record.k, `${loc.path}.k`);
  const kLoc = at(loc, "", ".k");
  checkExpression(p, ctx, kLoc);
  const read = (v: unknown, l: Loc) => numbers(v, l);
  if (!isKeyframed(p.k)) return { colorCount: count, values: read(p.k, at(kLoc, "", ".k")) };
  const keys = normalizeKeys(p.k, kLoc, read, ctx);
  if (keys.length === 1) return { colorCount: count, values: keys[0].value };
  const width = Math.min(...keys.map((k) => k.value.length));
  return { colorCount: count, values: toAeKeys(keys, ctx.fps, (v) => v.slice(0, width), 0, false) };
}

// ------------------------------------------------------------------ paths

type PathShape = { closed: boolean; vertices: number[][]; inTangents: number[][]; outTangents: number[][] };

function readPathShape(value: unknown, loc: Loc): PathShape {
  const shape = Array.isArray(value) ? value[0] : value;
  if (!shape || typeof shape !== "object") throw invalid(loc.path, "expected bézier path data {c, v, i, o}.");
  const record = shape as Record<string, unknown>;
  const pairs = (key: string) => {
    const list = record[key];
    if (!Array.isArray(list)) throw invalid(`${loc.path}.${key}`, "expected an array of [x, y] points.");
    return list.map((pt, index) => {
      const n = numbers(pt, { ...loc, path: `${loc.path}.${key}[${index}]` });
      if (n.length < 2) throw invalid(`${loc.path}.${key}[${index}]`, "expected [x, y].");
      return [n[0], n[1]];
    });
  };
  const vertices = pairs("v");
  const inTangents = pairs("i");
  const outTangents = pairs("o");
  if (inTangents.length !== vertices.length || outTangents.length !== vertices.length) {
    throw invalid(loc.path, "path `v`, `i` and `o` must have the same number of points.");
  }
  return { closed: record.c === true, vertices, inTangents, outTangents };
}

/**
 * A bézier path property. Keyframed paths become `PathKeyframe`s whose speed
 * is in "morphs per second" — the blend from one shape to the next.
 */
export function readPath(prop: unknown, ctx: ReadContext, loc: Loc): unknown {
  const p = validate(propertySchema, prop, loc.path);
  checkExpression(p, ctx, loc);
  if (!isKeyframed(p.k)) return readPathShape(p.k, at(loc, "", ".k"));

  ctx.keyframeCount.value += p.k.length;
  const keys = p.k.map((k, index) => validate(keyframeSchema, k, `${loc.path}.k[${index}]`));
  const shapes = keys.map((key, index) => {
    const keyLoc = at(loc, "", `.k[${index}]`);
    if (key.s !== undefined) return readPathShape(key.s, at(keyLoc, "", ".s"));
    if (index > 0 && keys[index - 1].e !== undefined) return readPathShape(keys[index - 1].e, at(keyLoc, "", ".e"));
    throw invalid(keyLoc.path, "path keyframe has no value.");
  });
  const counts = new Set(shapes.map((s) => s.vertices.length));
  if (counts.size > 1) {
    report(ctx, "info", "path vertex count changes", loc, "keyframes have different vertex counts; blends pair vertices by index, as lottie-web does.");
  }
  if (keys.length === 1) return shapes[0];
  const normal: NormalKey[] = keys.map((key, k) => ({ frame: key.t, value: [k], hold: key.h === 1, o: key.o, i: key.i }));
  // Ease a 0→1 blend per segment: average speed is one morph over the segment.
  const eases = toAeKeys(
    normal.map((k, index) => ({ ...k, value: [index] })),
    ctx.fps,
    (v) => v,
    0,
    false,
  );
  return eases.map((key, index) => orderKey({ ...key, value: shapes[index] }));
}
