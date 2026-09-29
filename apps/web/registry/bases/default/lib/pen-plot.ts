import type { Vec2 } from "./ae-motion";
import {
  parseD,
  pathLength,
  sampleAtLength,
  segmentLength,
  slicePath,
  tangentAt,
  toD,
  type BezierPath,
} from "./bezier-path";

/**
 * Pen-plotter motion planning: SVG strokes in, a pen position for any frame
 * out. The pen moves the way a motion controller drives a real plotter, which
 * is what makes an arm tracing it look machined rather than animated:
 *
 * - pen-down moves run at a cruise speed with cosine-ramped acceleration, and
 *   come to a full stop at every sharp corner (a cusp in a letter) instead of
 *   whipping round it;
 * - between strokes the pen lifts, travels with a little anticipation and
 *   overshoot (it is off the paper, so the overshoot costs no ink), settles,
 *   and drops with a small rebound;
 * - everything is a closed-form function of the frame. No state, no
 *   simulation: any frame renders identically in any order.
 */

export type PlotOptions = {
  /** Pen-down cruise speed, px per second. */
  speed?: number;
  /** Peak pen-up travel speed, px per second. */
  travelSpeed?: number;
  /** Frames to accelerate from rest to cruise speed (and to brake). */
  ramp?: number;
  /** Direction changes sharper than this (degrees) stop the pen, like a cusp. */
  cornerAngle?: number;
  /** Frames to raise or lower the pen. */
  liftFrames?: number;
  /** Shortest pen-up move, in frames. */
  minTravelFrames?: number;
  /** Back-ease strength of pen-up moves: anticipation and overshoot. 0 is none. */
  overshoot?: number;
  /** Frame the plan starts on. Negative starts mid-drawing on frame 0. */
  startFrame?: number;
  /** Where the pen waits, raised, before the first stroke. Default: above it. */
  home?: Vec2;
  /** Where the pen goes, raised, after the last stroke. Default: it stays. */
  park?: Vec2;
};

type Span = { s0: number; length: number; t0: number; duration: number; v: number; ramp: number };

export type PlotPhase =
  | { kind: "travel"; t0: number; t1: number; from: Vec2; to: Vec2 }
  | { kind: "lower" | "raise"; t0: number; t1: number; at: Vec2; stroke: number }
  | { kind: "draw"; t0: number; t1: number; stroke: number; spans: Span[] };

export type PlotPlan = {
  strokes: BezierPath[];
  /** Full `d` of every stroke, for drawn-out strokes. */
  strokeD: string[];
  lengths: number[];
  phases: PlotPhase[];
  start: number;
  /** Frame the pen comes to rest after the last move. */
  end: number;
  /** Pen position before the plan starts. */
  rest: Vec2;
  /** Back-ease strength of pen-up moves. */
  overshoot: number;
};

export type PenState = {
  position: Vec2;
  /** 0 = on the paper, 1 = fully raised. Can dip briefly below 1 on the drop. */
  lift: number;
  /** Pen down and laying ink this frame. */
  drawing: boolean;
  /** Stroke being drawn, or the last one touched; -1 before the first. */
  stroke: number;
  /** Ink laid so far, px, across all strokes. */
  inked: number;
  /** Share of all the ink in the plan laid so far, 0–1. */
  progress: number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const dist = (a: Vec2, b: Vec2) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Easing.inOut(Easing.back(s)) — anticipation, then overshoot, landing at 1 with zero velocity. */
export function backInOut(t: number, s: number): number {
  const back = (x: number) => x * x * ((s + 1) * x - s);
  const u = clamp01(t);
  return u < 0.5 ? back(2 * u) / 2 : 1 - back(2 * (1 - u)) / 2;
}

/** Distance covered by one cosine-ramped move of `span` at time `t` (frames). */
function spanDistance(span: Span, t: number): number {
  const { length, duration, v, ramp } = span;
  const rampDist = (x: number) => (v / 2) * (x - (ramp / Math.PI) * Math.sin((Math.PI * x) / ramp));
  if (t <= 0) return 0;
  if (t >= duration) return length;
  if (t < ramp) return rampDist(t);
  if (t > duration - ramp) return length - rampDist(duration - t);
  return rampDist(ramp) + v * (t - ramp);
}

function makeSpan(s0: number, length: number, t0: number, v: number, ramp: number): Span {
  if (length <= 1e-9) return { s0, length: 0, t0, duration: 0, v, ramp };
  const r = Math.max(1e-3, ramp);
  if (length >= v * r) {
    return { s0, length, t0, duration: 2 * r + (length - v * r) / v, v, ramp: r };
  }
  // Too short to reach cruise: a lower peak with the same acceleration.
  const peak = Math.sqrt((length * v) / r);
  const shortRamp = (r * peak) / v;
  return { s0, length, t0, duration: 2 * shortRamp, v: peak, ramp: shortRamp };
}

/** Arc lengths along a stroke where it turns sharper than `cornerAngle`. */
function cornerStops(path: BezierPath, cornerAngle: number): number[] {
  const stops: number[] = [];
  const limit = (cornerAngle * Math.PI) / 180;
  let cursor = 0;
  for (let i = 0; i < path.segments.length - 1; i += 1) {
    cursor += segmentLength(path.segments[i]);
    const a = tangentAt(path.segments[i], 1);
    const b = tangentAt(path.segments[i + 1], 0);
    const la = Math.hypot(a.x, a.y);
    const lb = Math.hypot(b.x, b.y);
    if (la < 1e-9 || lb < 1e-9) continue;
    const cos = Math.min(1, Math.max(-1, (a.x * b.x + a.y * b.y) / (la * lb)));
    if (Math.acos(cos) > limit) stops.push(cursor);
  }
  return stops;
}

const startOf = (p: BezierPath): Vec2 => [p.segments[0].p0.x, p.segments[0].p0.y];
const endOf = (p: BezierPath): Vec2 => {
  const last = p.segments[p.segments.length - 1];
  return [last.p1.x, last.p1.y];
};

/**
 * Plan a plot. `strokes` is SVG path data; every subpath (every `M`) is one
 * pen-down stroke, drawn in document order. Pass an array to keep strokes in
 * separate strings. Plan once per path (memoise it) and query every frame.
 */
export function planPlot(
  strokes: string | readonly string[],
  {
    speed = 540,
    travelSpeed = 900,
    ramp = 6,
    cornerAngle = 50,
    liftFrames = 5,
    minTravelFrames = 10,
    overshoot = 1.2,
    startFrame = 0,
    home,
    park,
  }: PlotOptions = {},
  fps = 30,
): PlotPlan {
  const paths = (typeof strokes === "string" ? [strokes] : strokes)
    .filter((d) => d.trim().length > 0)
    .flatMap((d) => parseD(d))
    .filter((p) => p.segments.length > 0)
    .map((p) => ({ ...p, closed: false }));
  if (paths.length === 0) throw new Error("pen-plot: the strokes contain no drawable path.");
  if (!(speed > 0) || !(travelSpeed > 0)) throw new Error("pen-plot: speeds must be positive.");

  const v = speed / fps;
  const travelV = travelSpeed / fps;
  const lift = Math.max(1, liftFrames);
  const phases: PlotPhase[] = [];
  let t = startFrame;

  const travel = (from: Vec2, to: Vec2) => {
    const d = dist(from, to);
    if (d < 0.5) return;
    // inOut(back(s)) peaks at (s + 3)× its mean speed, halfway through; size
    // the move so that peak is exactly travelSpeed.
    const duration = Math.max(minTravelFrames, (d * (Math.max(0, overshoot) + 3)) / travelV);
    phases.push({ kind: "travel", t0: t, t1: t + duration, from, to });
    t += duration;
  };

  const rest = home ?? startOf(paths[0]);
  let pen: Vec2 = rest;
  paths.forEach((path, stroke) => {
    travel(pen, startOf(path));
    phases.push({ kind: "lower", t0: t, t1: t + lift, at: startOf(path), stroke });
    t += lift;
    const length = pathLength(path);
    const bounds = [0, ...cornerStops(path, cornerAngle), length];
    const spans: Span[] = [];
    const t0 = t;
    for (let i = 0; i < bounds.length - 1; i += 1) {
      const span = makeSpan(bounds[i], bounds[i + 1] - bounds[i], t, v, ramp);
      spans.push(span);
      t += span.duration;
    }
    phases.push({ kind: "draw", t0, t1: t, stroke, spans });
    pen = endOf(path);
    phases.push({ kind: "raise", t0: t, t1: t + lift, at: pen, stroke });
    t += lift;
  });
  if (park) travel(pen, park);

  return {
    strokes: paths,
    strokeD: paths.map((p) => toD(p)),
    lengths: paths.map((p) => pathLength(p)),
    phases,
    start: startFrame,
    end: t,
    rest,
    overshoot: Math.max(0, overshoot),
  };
}

/** How far into the current draw phase the pen is, px along the stroke. */
function drawnAlong(phase: Extract<PlotPhase, { kind: "draw" }>, frame: number): number {
  for (const span of phase.spans) {
    if (frame <= span.t0 + span.duration) return span.s0 + spanDistance(span, frame - span.t0);
  }
  const last = phase.spans[phase.spans.length - 1];
  return last.s0 + last.length;
}

function activePhase(plan: PlotPlan, frame: number): { index: number; phase: PlotPhase } | null {
  for (let i = 0; i < plan.phases.length; i += 1) {
    if (frame < plan.phases[i].t1) return { index: i, phase: plan.phases[i] };
  }
  return null;
}

const inkBefore = (plan: PlotPlan, stroke: number) =>
  plan.lengths.slice(0, Math.max(0, stroke)).reduce((a, b) => a + b, 0);

/** The pen at a (fractional) frame. */
export function penAt(plan: PlotPlan, frame: number): PenState {
  const total = plan.lengths.reduce((a, b) => a + b, 0);
  const state = (position: Vec2, lift: number, drawing: boolean, stroke: number, inked: number): PenState => ({
    position,
    lift,
    drawing,
    stroke,
    inked,
    progress: total > 0 ? inked / total : 0,
  });

  if (frame < plan.start || plan.phases.length === 0) return state(plan.rest, 1, false, -1, 0);
  const found = activePhase(plan, frame);
  if (!found) {
    const last = plan.phases[plan.phases.length - 1];
    const position = last.kind === "travel" ? last.to : last.kind === "draw" ? endOf(plan.strokes[last.stroke]) : last.at;
    return state(position, 1, false, plan.strokes.length - 1, total);
  }

  const { index, phase } = found;
  const u = frame <= phase.t0 ? 0 : (frame - phase.t0) / (phase.t1 - phase.t0);
  if (phase.kind === "travel") {
    const k = backInOut(u, plan.overshoot);
    const position: Vec2 = [phase.from[0] + (phase.to[0] - phase.from[0]) * k, phase.from[1] + (phase.to[1] - phase.from[1]) * k];
    const previousStroke = plan.phases.slice(0, index).reduce((s, p) => (p.kind === "draw" ? p.stroke : s), -1);
    return state(position, 1, false, previousStroke, inkBefore(plan, previousStroke + 1));
  }
  if (phase.kind !== "draw") {
    if (phase.kind === "raise") {
      return state(phase.at, 1 - (1 - u) ** 2, false, phase.stroke, inkBefore(plan, phase.stroke + 1));
    }
    // Lower: accelerates down, touches at 70%, rebounds a hair and settles.
    const lift = u < 0.7 ? 1 - (u / 0.7) ** 2 : 0.12 * Math.sin((Math.PI * (u - 0.7)) / 0.3);
    return state(phase.at, lift, false, phase.stroke, inkBefore(plan, phase.stroke));
  }
  const along = drawnAlong(phase, frame);
  const p = sampleAtLength(plan.strokes[phase.stroke], along);
  return state([p.x, p.y], 0, true, phase.stroke, inkBefore(plan, phase.stroke) + along);
}

/**
 * The ink on the paper at a frame: one `d` per stroke started so far, the
 * current one cut exactly where the pen is.
 */
export function inkAt(plan: PlotPlan, frame: number): string[] {
  const ink: string[] = [];
  for (const phase of plan.phases) {
    if (phase.kind !== "draw" || frame <= phase.t0) continue;
    if (frame >= phase.t1) {
      ink.push(plan.strokeD[phase.stroke]);
      continue;
    }
    const along = drawnAlong(phase, frame);
    if (along > 0.01) ink.push(toD(slicePath(plan.strokes[phase.stroke], 0, along)));
  }
  return ink;
}
