/**
 * Lottie keyframe easing → `ae-motion` keyframes.
 *
 * A Lottie segment eases along a normalised cubic bézier: `o` is the handle
 * leaving the first key, `i` the handle arriving at the second, both in
 * (time, value) fractions of the segment. `ae-motion` stores the same curve
 * the way AE's Keyframe Velocity dialog does — speed (units per second) and
 * influence (0–1) on each side — so the mapping is exact:
 *
 *   influence(out) = o.x          speed(out) = o.y / o.x · average
 *   influence(in)  = 1 − i.x      speed(in)  = (1 − i.y) / (1 − i.x) · average
 *
 * where `average` is the segment's change over its duration: signed for a
 * scalar, the straight-line distance for a vector (what `ae-motion` divides
 * by). Feeding those back through `ae-motion` reproduces `(o.x, o.y, i.x,
 * i.y)` — see `easeToCubicBezier` there.
 */

export type TemporalEase = { speed: number; influence: number };

export type LottieEaseLike = { x: number | readonly number[]; y: number | readonly number[] };

/** One segment's handles, reduced to a single dimension. */
export type Handles = { ox: number; oy: number; ix: number; iy: number };

/** `ae-motion` clamps influence to this floor; the speed is scaled to match. */
export const MIN_INFLUENCE = 0.001;

const EPSILON = 1e-6;

const pick = (value: number | readonly number[], dimension: number): number =>
  typeof value === "number" ? value : (value[dimension] ?? value[0] ?? 0);

/** Handles for one dimension; a missing ease is AE's linear. */
export function handlesFor(
  o: LottieEaseLike | undefined,
  i: LottieEaseLike | undefined,
  dimension: number,
): Handles {
  if (!o || !i) return { ox: 0, oy: 0, ix: 1, iy: 1 };
  return { ox: pick(o.x, dimension), oy: pick(o.y, dimension), ix: pick(i.x, dimension), iy: pick(i.y, dimension) };
}

/** True when every dimension shares the same curve (the usual case). */
export function sameAcrossDimensions(
  o: LottieEaseLike | undefined,
  i: LottieEaseLike | undefined,
  dimensions: number,
): boolean {
  const first = handlesFor(o, i, 0);
  for (let d = 1; d < dimensions; d += 1) {
    const h = handlesFor(o, i, d);
    if (
      Math.abs(h.ox - first.ox) > EPSILON ||
      Math.abs(h.oy - first.oy) > EPSILON ||
      Math.abs(h.ix - first.ix) > EPSILON ||
      Math.abs(h.iy - first.iy) > EPSILON
    ) {
      return false;
    }
  }
  return true;
}

/** Handles on the diagonal draw a straight line: y = x exactly. */
export function isLinear(h: Handles): boolean {
  return Math.abs(h.ox - h.oy) < EPSILON && Math.abs(h.ix - h.iy) < EPSILON;
}

/**
 * The segment's average speed in units per second, measured the way
 * `ae-motion` measures it: signed for scalars, straight-line for vectors.
 */
export function averageSpeed(from: readonly number[], to: readonly number[], seconds: number): number {
  if (seconds <= 0) return 0;
  if (from.length === 1) return (to[0] - from[0]) / seconds;
  const distance = Math.sqrt(from.reduce((sum, v, k) => sum + (to[k] - v) ** 2, 0));
  return distance / seconds;
}

/** Samples on a motion path — lottie-web's count, mirrored by the ae-import runtime. */
export const SPATIAL_SAMPLES = 150;

/**
 * Arc length of a spatial segment (tangents relative to their key), over the
 * same polyline lottie-web and the runtime walk. Spatial keys measure speed
 * along this length, as AE's speed graph does for position, so a loop that
 * starts and ends on one point still keeps its ease.
 */
export function motionPathLength(
  a: readonly number[],
  b: readonly number[],
  out: readonly number[] = [0, 0],
  inn: readonly number[] = [0, 0],
): number {
  const c1 = [a[0] + (out[0] ?? 0), a[1] + (out[1] ?? 0)];
  const c2 = [b[0] + (inn[0] ?? 0), b[1] + (inn[1] ?? 0)];
  let length = 0;
  let prev: number[] | null = null;
  for (let k = 0; k < SPATIAL_SAMPLES; k += 1) {
    const u = k / (SPATIAL_SAMPLES - 1);
    const m = 1 - u;
    const point = [0, 1].map((i) => m * m * m * a[i] + 3 * m * m * u * c1[i] + 3 * m * u * u * c2[i] + u * u * u * b[i]);
    if (prev) length += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    prev = point;
  }
  return length;
}

const clampInfluence =(value: number) => Math.min(1, Math.max(MIN_INFLUENCE, value));

/**
 * The exact `ae-motion` eases for one Lottie segment.
 *
 * @param average The segment's average speed (`averageSpeed`).
 */
export function easesFromHandles(h: Handles, average: number): { easeOut: TemporalEase; easeIn: TemporalEase } {
  const outInfluence = clampInfluence(h.ox);
  const inInfluence = clampInfluence(1 - h.ix);
  return {
    easeOut: { speed: (h.oy / outInfluence) * average, influence: outInfluence },
    easeIn: { speed: ((1 - h.iy) / inInfluence) * average, influence: inInfluence },
  };
}

/**
 * The inverse, for checking: the normalised bézier `ae-motion` draws for a
 * pair of eases — the same arithmetic as its `easeToCubicBezier`.
 */
export function handlesFromEases(easeOut: TemporalEase, easeIn: TemporalEase, average: number): Handles {
  return {
    ox: easeOut.influence,
    oy: average === 0 ? 0 : (easeOut.speed / average) * easeOut.influence,
    ix: 1 - easeIn.influence,
    iy: average === 0 ? 1 : 1 - (easeIn.speed / average) * easeIn.influence,
  };
}
