/**
 * After Effects mechanics as pure, frame-driven functions.
 *
 * Every function here is a pure function of its arguments — no clocks, no
 * accumulated state — so a frame rendered out of order, or twice, on another
 * machine, comes out identical. That is the one property a server-side render
 * cannot live without, and it is why the noise is hashed rather than drawn from
 * `Math.random()`.
 *
 * Units, chosen once and used everywhere in the motion lane:
 * - time is in **frames** (Remotion-native); anything "per second" says so
 * - proportions are **0–1** (influence, opacity, trim start/end)
 * - angles are **degrees**, scale is a **factor** (1 = 100%)
 * - keyframe speed is **units per second** — what AE's graph editor shows
 */

// ------------------------------------------------------------------- types

export type Vec2 = readonly [number, number];
export type KeyValue = number | readonly number[];

/** One side of an AE temporal ease: the numbers in the Keyframe Velocity dialog. */
export type TemporalEase = {
  /** Value units per second. 0 = the curve arrives flat. */
  speed: number;
  /** 0–1. How far along the segment the handle reaches. AE clamps to 0.1–100%. */
  influence: number;
};

export type KeyInterpolation = "bezier" | "linear" | "hold";

export type Keyframe<V extends KeyValue = number> = {
  frame: number;
  value: V;
  /** Ease arriving at this key. Omitted = the linear-equivalent speed. */
  easeIn?: TemporalEase;
  /** Ease leaving this key. Omitted = the linear-equivalent speed. */
  easeOut?: TemporalEase;
  /** Interpolation leaving this key. Default `bezier`. */
  interpolation?: KeyInterpolation;
  /**
   * Spatial tangent arriving at this key, relative to its value — AE's
   * incoming handle on a motion path. Vector tracks only.
   */
  spatialIn?: readonly number[];
  /** Spatial tangent leaving this key, relative to its value. */
  spatialOut?: readonly number[];
};

export type KeyframeTrack<V extends KeyValue = number> = readonly Keyframe<V>[];

export type LoopType = "cycle" | "pingpong" | "offset" | "continue";

export type LoopSpec =
  | LoopType
  | {
      type: LoopType;
      /** Loop only the last N segments (AE's `numKeyframes`). 0 = all. */
      keyframes?: number;
    };

export type TrackOptions = {
  fps?: number;
  /** AE `loopOut()`: what the track does after its last key. */
  loopOut?: LoopSpec;
  /** AE `loopIn()`: what the track does before its first key. */
  loopIn?: LoopSpec;
};

/** What an expression receives. */
export type ExpressionContext = { frame: number; time: number; fps: number };

/**
 * A property value that can be static, keyframed, or an expression — the
 * three states a property has in an AE timeline.
 */
export type Animatable<V extends KeyValue = number> =
  | V
  | KeyframeTrack<V>
  | ((context: ExpressionContext) => V);

// --------------------------------------------------------------- constants

export const DEFAULT_FPS = 30;
/** AE's default influence when you convert a linear key to bezier. */
const DEFAULT_INFLUENCE = 1 / 6;
const MIN_INFLUENCE = 0.001;

/** F9 in AE: arrive and leave flat with a third of the segment as handle. */
export const EASY_EASE: TemporalEase = { speed: 0, influence: 1 / 3 };

/** A key with Easy Ease on both sides. */
export function easyEase<V extends KeyValue>(
  frame: number,
  value: V,
  influence = EASY_EASE.influence,
): Keyframe<V> {
  const ease = { speed: 0, influence };
  return { frame, value, easeIn: ease, easeOut: ease };
}

// ------------------------------------------------------------ bezier solve

function cubic(p1: number, p2: number, u: number): number {
  // Endpoints fixed at 0 and 1 — the normalised form every ease reduces to.
  const m = 1 - u;
  return 3 * m * m * u * p1 + 3 * m * u * u * p2 + u * u * u;
}

function cubicSlope(p1: number, p2: number, u: number): number {
  const m = 1 - u;
  return 3 * m * m * p1 + 6 * m * u * (p2 - p1) + 3 * u * u * (1 - p2);
}

/**
 * Bézier parameter `u` whose x equals `x`, for control xs in [0, 1].
 * Newton first (fast, usually 3–4 steps), bisection when it stalls — a flat
 * handle at influence 100% makes the slope vanish and Newton alone diverges.
 */
export function solveBezierX(x1: number, x2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let u = x;
  for (let i = 0; i < 8; i += 1) {
    const error = cubic(x1, x2, u) - x;
    if (Math.abs(error) < 1e-7) return u;
    const slope = cubicSlope(x1, x2, u);
    if (Math.abs(slope) < 1e-6) break;
    const next = u - error / slope;
    if (next < 0 || next > 1) break;
    u = next;
  }
  let lo = 0;
  let hi = 1;
  u = x;
  for (let i = 0; i < 48; i += 1) {
    const value = cubic(x1, x2, u);
    if (Math.abs(value - x) < 1e-7) return u;
    if (value < x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return u;
}

/** y of a normalised cubic bézier at x — what `Easing.bezier` computes. */
export function cubicBezierAt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  const u = solveBezierX(x1, x2, x);
  return cubic(y1, y2, u);
}

// ---------------------------------------------------------------- keyframes

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toArray = (value: KeyValue): number[] =>
  typeof value === "number" ? [value] : [...value];

function magnitude(values: readonly number[]): number {
  return Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
}

function influenceOf(ease: TemporalEase | undefined): number {
  return clamp(ease?.influence ?? DEFAULT_INFLUENCE, MIN_INFLUENCE, 1);
}

/**
 * The normalised cubic bézier AE draws between two keys: `[x1, y1, x2, y2]`,
 * ready for `Easing.bezier(...)`. Speed is divided by the segment's average
 * speed, which is exactly how the value graph maps onto the speed graph.
 *
 * Returns `null` when the segment has no value change — a normalised curve
 * cannot express an overshoot that starts and ends on the same value.
 */
export function easeToCubicBezier<V extends KeyValue>(
  from: Keyframe<V>,
  to: Keyframe<V>,
  fps = DEFAULT_FPS,
): [number, number, number, number] | null {
  const duration = to.frame - from.frame;
  const delta = magnitude(
    toArray(to.value).map((v, i) => v - toArray(from.value)[i]),
  );
  if (duration <= 0 || delta === 0) return null;

  const averageSpeed = (delta / duration) * fps;
  const outInfluence = influenceOf(from.easeOut);
  const inInfluence = influenceOf(to.easeIn);
  const outSpeed = from.easeOut ? from.easeOut.speed : averageSpeed;
  const inSpeed = to.easeIn ? to.easeIn.speed : averageSpeed;

  return [
    outInfluence,
    (outSpeed / averageSpeed) * outInfluence,
    1 - inInfluence,
    1 - (inSpeed / averageSpeed) * inInfluence,
  ];
}

/**
 * A spatial bézier between two vector keys, with an arc-length table so the
 * temporal ease can drive *distance along the path* — AE's speed graph. The
 * table is cached per outgoing key object; sorted tracks keep the originals.
 */
type SpatialCurve = {
  length: number;
  /** Point at a share (0–1) of the arc length. */
  at: (share: number) => number[];
  /** Unit direction of travel at a share of the arc length. */
  direction: (share: number) => number[];
};

const SPATIAL_STEPS = 48;
const spatialCache = new WeakMap<object, { to: object; curve: SpatialCurve | null }>();

function hasTangent(t: readonly number[] | undefined): boolean {
  return !!t && t.some((v) => v !== 0);
}

function spatialCurve(from: Keyframe<KeyValue>, to: Keyframe<KeyValue>): SpatialCurve | null {
  const cached = spatialCache.get(from);
  if (cached && cached.to === to) return cached.curve;
  const a = toArray(from.value);
  const b = toArray(to.value);
  let curve: SpatialCurve | null = null;
  if (a.length > 1 && (hasTangent(from.spatialOut) || hasTangent(to.spatialIn))) {
    const c1 = a.map((v, i) => v + (from.spatialOut?.[i] ?? 0));
    const c2 = b.map((v, i) => v + (to.spatialIn?.[i] ?? 0));
    const point = (u: number) => {
      const m = 1 - u;
      return a.map(
        (v, i) => m * m * m * v + 3 * m * m * u * c1[i] + 3 * m * u * u * c2[i] + u * u * u * b[i],
      );
    };
    const slope = (u: number) => {
      const m = 1 - u;
      return a.map(
        (v, i) => 3 * m * m * (c1[i] - v) + 6 * m * u * (c2[i] - c1[i]) + 3 * u * u * (b[i] - c2[i]),
      );
    };
    const table = [0];
    let previous = point(0);
    for (let k = 1; k <= SPATIAL_STEPS; k += 1) {
      const next = point(k / SPATIAL_STEPS);
      table.push(table[k - 1] + magnitude(next.map((v, i) => v - previous[i])));
      previous = next;
    }
    const length = table[SPATIAL_STEPS];
    const paramAt = (share: number) => {
      const target = clamp(share, 0, 1) * length;
      let k = 1;
      while (k < SPATIAL_STEPS && table[k] < target) k += 1;
      const span = table[k] - table[k - 1];
      return (k - 1 + (span === 0 ? 0 : (target - table[k - 1]) / span)) / SPATIAL_STEPS;
    };
    const unitOf = (v: number[]) => {
      const l = magnitude(v);
      return l === 0 ? b.map((x, i) => x - a[i]) : v.map((x) => x / l);
    };
    curve = {
      length,
      at: (share) => point(paramAt(share)),
      direction: (share) => unitOf(slope(paramAt(share))),
    };
  }
  spatialCache.set(from, { to, curve });
  return curve;
}

/**
 * Share of the way through a segment at `frame`: time share for linear, the
 * eased share of distance for bézier (vectors), 0/1 for hold. Scalars do not
 * use this — they are solved on their own value graph.
 */
function segmentShare(
  from: Keyframe<KeyValue>,
  to: Keyframe<KeyValue>,
  frame: number,
  fps: number,
  distance: number,
): number {
  const duration = to.frame - from.frame;
  const x = duration <= 0 ? 1 : (frame - from.frame) / duration;
  const mode = from.interpolation ?? "bezier";
  if (mode === "hold") return x >= 1 ? 1 : 0;
  if (mode === "linear" || distance === 0) return clamp(x, 0, 1);
  const outInfluence = influenceOf(from.easeOut);
  const inInfluence = influenceOf(to.easeIn);
  const u = solveBezierX(outInfluence, 1 - inInfluence, x);
  const average = distance / (duration / fps);
  const outRatio = from.easeOut ? from.easeOut.speed / average : 1;
  const inRatio = to.easeIn ? to.easeIn.speed / average : 1;
  return cubic(outRatio * outInfluence, 1 - inRatio * inInfluence, u);
}

/**
 * One segment in value space. Scalars are solved on their own value graph, so
 * a key pair with equal values can still overshoot (the speed handles lift the
 * curve). Vectors travel their spatial path — a straight line, or the bézier
 * the keys' spatial tangents describe — at the eased rate, with speed measured
 * along the path, exactly as AE's speed graph does for position.
 */
function evaluateSegment(
  from: Keyframe<KeyValue>,
  to: Keyframe<KeyValue>,
  frame: number,
  fps: number,
): number[] {
  const a = toArray(from.value);
  const b = toArray(to.value);
  const duration = to.frame - from.frame;
  const x = duration <= 0 ? 1 : (frame - from.frame) / duration;
  const mode = from.interpolation ?? "bezier";

  if (a.length === 1) {
    if (mode === "hold") return x >= 1 ? b : a;
    if (mode === "linear") return [a[0] + (b[0] - a[0]) * x];
    const outInfluence = influenceOf(from.easeOut);
    const inInfluence = influenceOf(to.easeIn);
    const u = solveBezierX(outInfluence, 1 - inInfluence, x);
    const seconds = duration / fps;
    const delta = b[0] - a[0];
    const outSpeed = from.easeOut ? from.easeOut.speed : delta / seconds;
    const inSpeed = to.easeIn ? to.easeIn.speed : delta / seconds;
    const y1 = a[0] + outSpeed * outInfluence * seconds;
    const y2 = b[0] - inSpeed * inInfluence * seconds;
    const m = 1 - u;
    return [
      m * m * m * a[0] + 3 * m * m * u * y1 + 3 * m * u * u * y2 + u * u * u * b[0],
    ];
  }

  const curve = spatialCurve(from, to);
  const distance = curve ? curve.length : magnitude(b.map((v, i) => v - a[i]));
  if (distance === 0 && mode !== "hold") return a;
  const share = segmentShare(from, to, frame, fps, distance);
  if (curve) return curve.at(share);
  return a.map((v, i) => v + (b[i] - v) * share);
}

function assertTrack(track: KeyframeTrack<KeyValue>): void {
  if (track.length === 0) {
    throw new Error("ae-motion: a keyframe track needs at least one key.");
  }
  const size = toArray(track[0].value).length;
  for (const key of track) {
    if (!Number.isFinite(key.frame)) {
      throw new Error(`ae-motion: keyframe has a non-finite frame (${key.frame}).`);
    }
    if (toArray(key.value).length !== size) {
      throw new Error(
        "ae-motion: every key in a track must have the same number of dimensions.",
      );
    }
  }
}

const sortedCache = new WeakMap<object, readonly Keyframe<KeyValue>[]>();

/** Keys in time order. Cached per track array so a frame never re-sorts. */
function sorted(track: KeyframeTrack<KeyValue>): readonly Keyframe<KeyValue>[] {
  const cached = sortedCache.get(track);
  if (cached) return cached;
  assertTrack(track);
  const copy = [...track].sort((a, b) => a.frame - b.frame);
  sortedCache.set(track, copy);
  return copy;
}

function sampleInside(
  keys: readonly Keyframe<KeyValue>[],
  frame: number,
  fps: number,
): number[] {
  if (frame <= keys[0].frame) return toArray(keys[0].value);
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return toArray(last.value);
  let index = 0;
  while (index < keys.length - 2 && frame >= keys[index + 1].frame) index += 1;
  return evaluateSegment(keys[index], keys[index + 1], frame, fps);
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * Per-frame slope at a track's first or last key, measured from the inside
 * only — a central difference would straddle the key, average in the flat
 * hold beyond it, and report half the real speed.
 */
function edgeVelocity(
  keys: readonly Keyframe<KeyValue>[],
  frame: number,
  direction: 1 | -1,
  fps: number,
): number[] {
  const h = 0.01;
  const at = sampleInside(keys, frame, fps);
  const inside = sampleInside(keys, frame + direction * h, fps);
  return at.map((v, i) => ((v - inside[i]) / h) * -direction);
}

function resolveLoop(spec: LoopSpec): { type: LoopType; keyframes: number } {
  return typeof spec === "string"
    ? { type: spec, keyframes: 0 }
    : { type: spec.type, keyframes: Math.max(0, Math.round(spec.keyframes ?? 0)) };
}

function sampleLoopOut(
  keys: readonly Keyframe<KeyValue>[],
  frame: number,
  spec: LoopSpec,
  fps: number,
): number[] {
  const { type, keyframes } = resolveLoop(spec);
  const last = keys[keys.length - 1];
  const first =
    keyframes > 0 ? keys[Math.max(0, keys.length - 1 - keyframes)] : keys[0];
  const start = first.frame;
  const end = last.frame;
  const duration = end - start;

  if (type === "continue" || duration <= 0) {
    const velocity = edgeVelocity(keys, end, -1, fps);
    return toArray(last.value).map((v, i) => v + velocity[i] * (frame - end));
  }

  const elapsed = frame - end;
  const cycle = Math.floor(elapsed / duration);
  const local = mod(elapsed, duration);

  if (type === "pingpong") {
    const time = cycle % 2 === 0 ? end - local : start + local;
    return sampleInside(keys, time, fps);
  }

  const cycled = sampleInside(keys, start + local, fps);
  if (type === "cycle") return cycled;

  const step = toArray(last.value).map((v, i) => v - toArray(first.value)[i]);
  return cycled.map((v, i) => v + step[i] * (cycle + 1));
}

function sampleLoopIn(
  keys: readonly Keyframe<KeyValue>[],
  frame: number,
  spec: LoopSpec,
  fps: number,
): number[] {
  const { type, keyframes } = resolveLoop(spec);
  const first = keys[0];
  const last = keyframes > 0 ? keys[Math.min(keys.length - 1, keyframes)] : keys[keys.length - 1];
  const start = first.frame;
  const end = last.frame;
  const duration = end - start;

  if (type === "continue" || duration <= 0) {
    const velocity = edgeVelocity(keys, start, 1, fps);
    return toArray(first.value).map((v, i) => v + velocity[i] * (frame - start));
  }

  const before = start - frame;
  const cycle = Math.floor(before / duration);
  const local = mod(before, duration);

  if (type === "pingpong") {
    const time = cycle % 2 === 0 ? start + local : end - local;
    return sampleInside(keys, time, fps);
  }

  const cycled = sampleInside(keys, end - local, fps);
  if (type === "cycle") return cycled;

  const step = toArray(last.value).map((v, i) => v - toArray(first.value)[i]);
  return cycled.map((v, i) => v - step[i] * (cycle + 1));
}

function sampleRaw(
  track: KeyframeTrack<KeyValue>,
  frame: number,
  options: TrackOptions,
): number[] {
  const keys = sorted(track);
  const fps = options.fps ?? DEFAULT_FPS;
  const last = keys[keys.length - 1];
  if (options.loopOut && keys.length > 1 && frame > last.frame) {
    return sampleLoopOut(keys, frame, options.loopOut, fps);
  }
  if (options.loopIn && keys.length > 1 && frame < keys[0].frame) {
    return sampleLoopIn(keys, frame, options.loopIn, fps);
  }
  return sampleInside(keys, frame, fps);
}

/**
 * Value of a keyframe track at a frame. Before the first key it holds the
 * first value, after the last it holds the last — unless a loop is set.
 */
export function sampleTrack<V extends KeyValue>(
  track: KeyframeTrack<V>,
  frame: number,
  options: TrackOptions = {},
): V {
  const values = sampleRaw(track, frame, options);
  return (typeof track[0].value === "number" ? values[0] : values) as V;
}

/** AE's `valueAtTime(t)`: the same sample, addressed in seconds. */
export function valueAtTime<V extends KeyValue>(
  track: KeyframeTrack<V>,
  seconds: number,
  options: TrackOptions = {},
): V {
  const fps = options.fps ?? DEFAULT_FPS;
  return sampleTrack(track, seconds * fps, { ...options, fps });
}

/** Velocity in units per second, by central difference. */
export function velocityAtFrame(
  track: KeyframeTrack<KeyValue>,
  frame: number,
  options: TrackOptions = {},
): number[] {
  const fps = options.fps ?? DEFAULT_FPS;
  const h = 0.01;
  const ahead = sampleRaw(track, frame + h, options);
  const behind = sampleRaw(track, frame - h, options);
  return ahead.map((v, i) => ((v - behind[i]) / (2 * h)) * fps);
}

/**
 * AE's Auto-Orient Along Path: heading in degrees (0 = +x, clockwise on
 * screen) of a 2D track at a frame. Read from the path's geometry rather than
 * from velocity, so it holds its direction through an ease that stops dead
 * and before the first / after the last key, where velocity is zero.
 */
export function orientAtFrame(
  track: KeyframeTrack<KeyValue>,
  frame: number,
  options: TrackOptions = {},
): number {
  const keys = sorted(track);
  if (keys.length < 2 || toArray(keys[0].value).length < 2) return 0;
  const fps = options.fps ?? DEFAULT_FPS;
  const clamped = clamp(frame, keys[0].frame, keys[keys.length - 1].frame);
  let index = 0;
  while (index < keys.length - 2 && clamped >= keys[index + 1].frame) index += 1;
  const from = keys[index];
  const to = keys[index + 1];
  const a = toArray(from.value);
  const b = toArray(to.value);
  const curve = spatialCurve(from, to);
  const distance = curve ? curve.length : magnitude(b.map((v, i) => v - a[i]));
  const share = segmentShare(from, to, clamped, fps, distance);
  const direction = curve ? curve.direction(share) : b.map((v, i) => v - a[i]);
  return (Math.atan2(direction[1], direction[0]) * 180) / Math.PI;
}

function isTrack(value: unknown): value is KeyframeTrack<KeyValue> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    "frame" in value[0]
  );
}

/**
 * Resolve any `Animatable` at a frame: a static value passes through, a track
 * is sampled, an expression is called.
 */
export function resolveAnimatable<V extends KeyValue>(
  value: Animatable<V>,
  frame: number,
  options: TrackOptions = {},
): V {
  const fps = options.fps ?? DEFAULT_FPS;
  if (typeof value === "function") {
    return value({ frame, time: frame / fps, fps });
  }
  if (isTrack(value)) {
    return sampleTrack(value as KeyframeTrack<V>, frame, { ...options, fps });
  }
  return value as V;
}

// -------------------------------------------------------------------- noise

/**
 * 32-bit integer hash → [0, 1). Integer maths only, so every platform agrees
 * bit for bit; a `sin()` hash can drift between engines.
 */
export function hash01(a: number, b = 0, c = 0): number {
  let h =
    Math.imul(Math.floor(a) | 0, 0x9e3779b1) ^
    Math.imul(Math.floor(b) | 0, 0x85ebca77) ^
    Math.imul(Math.floor(c) | 0, 0xc2b2ae3d);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Smooth 1D noise in roughly [-1, 1]. Catmull-Rom through hashed lattice
 * values: unlike a faded value noise it never pauses on a lattice point, and
 * unlike 1D Perlin it has no forced zero crossing every unit — both of which
 * read as a mechanical rhythm in a wiggle.
 */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const t = x - i;
  const p0 = hash01(i - 1, seed, 17) * 2 - 1;
  const p1 = hash01(i, seed, 17) * 2 - 1;
  const p2 = hash01(i + 1, seed, 17) * 2 - 1;
  const p3 = hash01(i + 2, seed, 17) * 2 - 1;
  const t2 = t * t;
  const t3 = t2 * t;
  const value =
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  return clamp(value, -1, 1);
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function gradient3(ix: number, iy: number, iz: number, seed: number, x: number, y: number, z: number) {
  // 12 cube-edge gradients, picked by hash — Perlin's improved-noise set.
  const h = Math.floor(hash01(ix + seed * 7919, iy, iz) * 12);
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** 3D gradient noise in roughly [-1, 1]. Use `z` as time for evolving fields. */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fade(fx);
  const v = fade(fy);
  const w = fade(fz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const g = (dx: number, dy: number, dz: number) =>
    gradient3(ix + dx, iy + dy, iz + dz, seed, fx - dx, fy - dy, fz - dz);

  const value = lerp(
    lerp(lerp(g(0, 0, 0), g(1, 0, 0), u), lerp(g(0, 1, 0), g(1, 1, 0), u), v),
    lerp(lerp(g(0, 0, 1), g(1, 0, 1), u), lerp(g(0, 1, 1), g(1, 1, 1), u), v),
    w,
  );
  return clamp(value, -1, 1);
}

export type WiggleOptions = {
  fps?: number;
  /** AE's `octaves`: extra layers of detail, each at double the frequency. */
  octaves?: number;
  /** AE's `amp_mult`: amplitude of each octave relative to the last. */
  ampMult?: number;
  /** Channel index, so x and y of a position wiggle independently. */
  dimension?: number;
};

/**
 * AE's `wiggle(freq, amp)` — deterministic. Frequency is wiggles per second;
 * the result is an offset in [-amp, amp] (more with extra octaves, as in AE).
 */
export function wiggle(
  freq: number,
  amp: number,
  seed: number,
  frame: number,
  { fps = DEFAULT_FPS, octaves = 1, ampMult = 0.5, dimension = 0 }: WiggleOptions = {},
): number {
  const time = (frame / fps) * freq;
  let sum = 0;
  let amplitude = amp;
  let scale = 1;
  const layers = Math.max(1, Math.round(octaves));
  for (let octave = 0; octave < layers; octave += 1) {
    const channel = Math.round(seed) * 101 + dimension * 7 + octave * 13;
    sum += amplitude * noise1(time * scale + octave * 31.7, channel);
    amplitude *= ampMult;
    scale *= 2;
  }
  return sum;
}

/** `wiggle` for every dimension of a vector, each channel independent. */
export function wiggleVec(
  dimensions: number,
  freq: number,
  amp: number,
  seed: number,
  frame: number,
  options: Omit<WiggleOptions, "dimension"> = {},
): number[] {
  return Array.from({ length: dimensions }, (_, dimension) =>
    wiggle(freq, amp, seed, frame, { ...options, dimension }),
  );
}

// ---------------------------------------------------------------- transforms

/** 2D affine matrix in CSS order: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Mat2D = readonly [number, number, number, number, number, number];

export const IDENTITY: Mat2D = [1, 0, 0, 1, 0, 0];

/** `m · n` — apply `n` first, then `m`. */
export function multiply(m: Mat2D, n: Mat2D): Mat2D {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function invert(m: Mat2D): Mat2D {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-12) {
    throw new Error("ae-motion: matrix is not invertible (a scale of 0?).");
  }
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}

export const translation = (x: number, y: number): Mat2D => [1, 0, 0, 1, x, y];

export function rotation(degrees: number): Mat2D {
  const r = (degrees * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [cos, sin, -sin, cos, 0, 0];
}

export const scaling = (sx: number, sy = sx): Mat2D => [sx, 0, 0, sy, 0, 0];

export function applyToPoint(m: Mat2D, point: Vec2): [number, number] {
  return [
    m[0] * point[0] + m[2] * point[1] + m[4],
    m[1] * point[0] + m[3] * point[1] + m[5],
  ];
}

export function toCssMatrix(m: Mat2D): string {
  return `matrix(${m.map((v) => +v.toFixed(6)).join(",")})`;
}

/** An AE layer's Transform group. */
export type LayerTransform = {
  anchor?: Vec2;
  position?: Vec2;
  /** Factor; a number scales both axes. */
  scale?: number | Vec2;
  /** Degrees, clockwise on screen. */
  rotation?: number;
  /** Degrees of shear. */
  skew?: number;
  /** Degrees; the axis the shear runs along. */
  skewAxis?: number;
};

/**
 * The matrix AE builds from a Transform group, in AE's order: move the anchor
 * to the origin, scale, skew, rotate, then translate to position.
 */
export function layerMatrix({
  anchor = [0, 0],
  position = [0, 0],
  scale = 1,
  rotation: degrees = 0,
  skew = 0,
  skewAxis = 0,
}: LayerTransform = {}): Mat2D {
  const [sx, sy] = typeof scale === "number" ? [scale, scale] : scale;
  let m = translation(-anchor[0], -anchor[1]);
  m = multiply(scaling(sx, sy), m);
  if (skew !== 0) {
    const shear: Mat2D = [1, 0, Math.tan((-skew * Math.PI) / 180), 1, 0, 0];
    m = multiply(multiply(rotation(skewAxis), multiply(shear, rotation(-skewAxis))), m);
  }
  m = multiply(rotation(degrees), m);
  return multiply(translation(position[0], position[1]), m);
}

/**
 * One step of a repeater transform. Unlike a layer, a repeater's anchor is a
 * pivot, not an offset: copy 1 rotates and scales *around* the anchor and then
 * moves by `position`. That is what makes the classic radial trick work —
 * position 0, anchor pushed out, rotation 360/n — and copy 0 stays put.
 */
function repeaterStep(transform: LayerTransform, fraction: number): Mat2D {
  const anchor = transform.anchor ?? [0, 0];
  const position = transform.position ?? [0, 0];
  const [sx, sy] =
    typeof transform.scale === "number"
      ? [transform.scale, transform.scale]
      : (transform.scale ?? [1, 1]);
  const power = (s: number) => Math.sign(s) * Math.abs(s) ** fraction;
  return layerMatrix({
    anchor,
    position: [anchor[0] + position[0] * fraction, anchor[1] + position[1] * fraction],
    scale: [power(sx), power(sy)],
    rotation: (transform.rotation ?? 0) * fraction,
  });
}

/**
 * `step^power` for a repeater transform, fractional powers included: whole
 * steps compound exactly (so position + rotation curls into an arc, as it does
 * in AE), and the remainder is the step with every parameter scaled by the
 * fraction, so animating a repeater's offset glides instead of snapping.
 */
export function transformPower(transform: LayerTransform, power: number): Mat2D {
  if (power < 0) return invert(transformPower(transform, -power));
  const whole = Math.floor(power);
  const fraction = power - whole;
  const step = repeaterStep(transform, 1);
  let m = IDENTITY;
  for (let i = 0; i < whole; i += 1) m = multiply(step, m);
  if (fraction > 1e-9) m = multiply(repeaterStep(transform, fraction), m);
  return m;
}

/** Position, rotation and scale a matrix encodes (no skew). */
export function decompose(m: Mat2D): {
  position: [number, number];
  rotation: number;
  scale: [number, number];
} {
  const sx = Math.hypot(m[0], m[1]);
  const det = m[0] * m[3] - m[1] * m[2];
  return {
    position: [m[4], m[5]],
    rotation: (Math.atan2(m[1], m[0]) * 180) / Math.PI,
    scale: [sx, sx === 0 ? 0 : det / sx],
  };
}

export type ParentedLayer = {
  /** Id of the parent layer or null object. */
  parent?: string;
  transform: LayerTransform;
};

/**
 * World matrices for a set of parented layers — AE's pick-whip. A child's
 * world matrix is its parent's world matrix times its own, so moving a null
 * carries every layer parented under it. Opacity does not inherit, as in AE.
 */
export function resolveParenting(
  layers: Readonly<Record<string, ParentedLayer>>,
): Record<string, Mat2D> {
  const world: Record<string, Mat2D> = {};

  const visit = (id: string, trail: string[]): Mat2D => {
    if (world[id]) return world[id];
    const layer = layers[id];
    if (!layer) {
      throw new Error(`ae-motion: "${trail[trail.length - 1]}" is parented to missing layer "${id}".`);
    }
    if (trail.includes(id)) {
      throw new Error(`ae-motion: parenting cycle ${[...trail, id].join(" → ")}.`);
    }
    const local = layerMatrix(layer.transform);
    const matrix = layer.parent
      ? multiply(visit(layer.parent, [...trail, id]), local)
      : local;
    world[id] = matrix;
    return matrix;
  };

  for (const id of Object.keys(layers)) visit(id, []);
  return world;
}

/** AE's `toComp()`: a point in a layer's own space, in composition space. */
export function toComp(world: Mat2D, point: Vec2): [number, number] {
  return applyToPoint(world, point);
}
