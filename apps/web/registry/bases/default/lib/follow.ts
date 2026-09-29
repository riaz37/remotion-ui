import { resolveAnimatable, type Animatable, type Vec2 } from "./ae-motion";

/**
 * Overlapping action — drag, lag, overshoot, settle — along a chain of
 * elements that all follow one leader, like AE's delay and inertia
 * expressions but frame-deterministic.
 *
 * Each link is a damped spring chasing the link before it (the first chases
 * the leader), optionally looking back `delay` frames. The chain is
 * integrated with a fixed sub-step from frame 0, so the state at any frame is
 * a pure function of the leader's track: render frames in any order, on any
 * machine, and the answer is the same. Results are memoised per leader and
 * options, so a render pays for each frame once, not once per frame rendered.
 */

export type FollowOptions = {
  /** Links after the leader. */
  links: number;
  /** Spring frequency in Hz. Higher is tighter. */
  frequency?: number;
  /** 1 settles without overshoot; below 1 overshoots and rings. */
  damping?: number;
  /** Frames each link looks back at the one before it — pure lag. */
  delay?: number;
  /**
   * Scales each successive link's frequency, so the tail can be looser than
   * the head (a whip) or tighter (a stiff chain). 1 keeps them equal.
   */
  falloff?: number;
  /** Sub-steps per frame. 4 is stable for frequencies up to ~6 Hz at 30fps. */
  substeps?: number;
};

export type FollowState = {
  position: Vec2;
  velocity: Vec2;
  /** Degrees; heading of travel (holds the last heading when at rest). */
  angle: number;
  /** Degrees; direction from this link to the one before it. */
  toPrevious: number;
};

/** A mutable point — the integrator writes into these in place. */
type Point = [number, number];

type Series = {
  /** positions[frame][link] for links 0..n (0 = leader). */
  positions: Point[][];
  velocities: Point[][];
};

const cache = new WeakMap<object, Map<string, Series>>();
const staticCache = new Map<string, Series>();

/**
 * The memo for one leader. Tracks and expressions are keyed by identity (pass
 * a stable reference — a module constant or a `useMemo` — to benefit); a
 * static position is keyed by value.
 */
function seriesFor(leader: Animatable<Vec2>, key: string): { series: Series; store: (s: Series) => void } {
  const isStatic = Array.isArray(leader) && typeof leader[0] === "number";
  if (isStatic) {
    const k = `${JSON.stringify(leader)}|${key}`;
    return { series: staticCache.get(k) ?? { positions: [], velocities: [] }, store: (s) => staticCache.set(k, s) };
  }
  const holder = leader as unknown as object;
  const byKey = cache.get(holder) ?? new Map<string, Series>();
  cache.set(holder, byKey);
  return { series: byKey.get(key) ?? { positions: [], velocities: [] }, store: (s) => byKey.set(key, s) };
}

function lerp(a: Vec2, b: Vec2, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Position of link `i` at a fractional frame, from what has been integrated. */
function lookup(series: Series, frame: number, link: number): Point {
  if (frame <= 0) return series.positions[0][link];
  const f = Math.floor(frame);
  const t = frame - f;
  const a = series.positions[Math.min(f, series.positions.length - 1)][link];
  const b = series.positions[Math.min(f + 1, series.positions.length - 1)][link];
  return lerp(a, b, t);
}

/**
 * Every link's state at `frame`. The leader (link 0) is the track itself.
 */
export function followChain(
  leader: Animatable<Vec2>,
  frame: number,
  { links, frequency = 2.2, damping = 0.45, delay = 0, falloff = 1, substeps = 4 }: FollowOptions,
  fps = 30,
): FollowState[] {
  if (!(links >= 0) || !Number.isInteger(links)) throw new Error("follow: links must be a whole number ≥ 0.");
  if (!(frequency > 0)) throw new Error("follow: frequency must be positive.");
  const key = [links, frequency, damping, delay, falloff, substeps, fps].join(",");
  const { series, store } = seriesFor(leader, key);
  const target = Math.max(0, Math.ceil(frame) + 1);
  const at = (f: number) => resolveAnimatable(leader, f, { fps });

  if (series.positions.length === 0) {
    const start = at(0);
    series.positions.push(Array.from({ length: links + 1 }, (): Point => [start[0], start[1]]));
    series.velocities.push(Array.from({ length: links + 1 }, (): Point => [0, 0]));
  }

  const dt = 1 / fps / substeps;
  while (series.positions.length <= target) {
    const f = series.positions.length - 1;
    const pos = series.positions[f].map((p): Point => [p[0], p[1]]);
    const vel = series.velocities[f].map((v): Point => [v[0], v[1]]);
    for (let s = 1; s <= substeps; s += 1) {
      const time = f + s / substeps;
      const lead = at(time);
      pos[0] = [lead[0], lead[1]];
      for (let i = 1; i <= links; i += 1) {
        const omega = 2 * Math.PI * frequency * falloff ** (i - 1);
        // Look back `delay` frames at the link ahead; before the history
        // exists, the link ahead's current position stands in for it.
        const goal = delay > 0 && time - delay >= 0 ? lookup(series, time - delay, i - 1) : pos[i - 1];
        for (let axis = 0; axis < 2; axis += 1) {
          const accel = omega * omega * (goal[axis] - pos[i][axis]) - 2 * damping * omega * vel[i][axis];
          vel[i][axis] += accel * dt;
          pos[i][axis] += vel[i][axis] * dt;
        }
      }
    }
    vel[0] = [(pos[0][0] - series.positions[f][0][0]) * fps, (pos[0][1] - series.positions[f][0][1]) * fps];
    series.positions.push(pos);
    series.velocities.push(vel);
  }
  store(series);

  const fInt = Math.floor(Math.max(0, frame));
  const t = Math.max(0, frame) - fInt;
  const heading: number[] = new Array(links + 1).fill(0);
  return Array.from({ length: links + 1 }, (_, i) => {
    const position: Vec2 = i === 0 ? at(frame) : lookup(series, Math.max(0, frame), i);
    const va = series.velocities[fInt][i];
    const vb = series.velocities[Math.min(fInt + 1, series.velocities.length - 1)][i];
    const velocity = lerp(va, vb, t);
    // Heading of travel; at rest, keep the last heading any earlier frame had.
    let angle = heading[i];
    for (let k = fInt; k >= 0; k -= 1) {
      const v = series.velocities[k][i];
      if (Math.hypot(v[0], v[1]) > 1e-3) {
        angle = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
        break;
      }
    }
    const previous = i === 0 ? position : lookup(series, Math.max(0, frame), i - 1);
    const toPrevious =
      i === 0 ? angle : (Math.atan2(previous[1] - position[1], previous[0] - position[0]) * 180) / Math.PI;
    return { position, velocity, angle, toPrevious };
  });
}
