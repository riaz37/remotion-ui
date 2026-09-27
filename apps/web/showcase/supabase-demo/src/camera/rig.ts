import { Easing, interpolate, spring } from "remotion";
import { FPS, HEIGHT, WIDTH } from "../timeline";
import type { Point } from "../world/layout";

/**
 * rig.ts — the virtual camera.
 *
 * A camera is the world point at the centre of the frame plus a scale. Moves
 * are data (see shots.ts); this file turns them into a camera for any frame,
 * including fractional frames, which is what the motion blur samples.
 *
 * Scale is always interpolated in log space: a zoom from 0.33 to 1.36 is a
 * 4× change, and a linear lerp would spend almost all of its time looking
 * zoomed-out. Log space makes every doubling take the same time — the way a
 * real zoom lens reads.
 */

export type Camera = { x: number; y: number; s: number };

export type MoveKind =
  /** Zoom out, travel, zoom in — the film's scene change. */
  | "travel"
  /** One continuous ease: a pan, or a push in on a detail. */
  | "glide"
  /** A pull out where the settle overshoots slightly past the target. */
  | "pull"
  /** No motion at all: the camera is simply somewhere else. */
  | "cut";

export type Move = {
  kind: MoveKind;
  start: number;
  end: number;
  to: Camera;
  /** Slow push-in while holding after the move, per frame. */
  drift?: number;
  /** Overrides the positional easing curve. */
  easing?: (t: number) => number;
  /**
   * Scales the motion blur while this move runs (default 1). A slow lean in on
   * text being typed sets it low: a zoom smears the edges, not the centre.
   */
  blur?: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TRAVEL_EASE = Easing.bezier(0.72, 0, 0.26, 1);
const GLIDE_EASE = Easing.bezier(0.55, 0, 0.18, 1);
const DEFAULT_DRIFT = 0.00028;

/**
 * Scale settles on a spring so it overshoots a few percent and comes back:
 * the lens lands, rather than stopping on a keyframe. The spring runs a little
 * past the positional move so the settle reads after the travel has finished.
 */
const SCALE_SPRING = { damping: 14, stiffness: 120, mass: 0.9 } as const;
const SCALE_SETTLE = 10;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** How far a travel pulls out, as a scale that fits both ends of the trip. */
const travelDipScale = (from: Camera, to: Camera): number => {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const fit = WIDTH / (distance * 1.05 + 1250);
  return Math.min(fit, Math.min(from.s, to.s) * 0.82);
};

const scaleProgress = (frame: number, move: Move): number =>
  spring({
    frame: frame - move.start,
    fps: FPS,
    config: SCALE_SPRING,
    durationInFrames: move.end - move.start + SCALE_SETTLE,
  });

export const evaluateMove = (move: Move, from: Camera, frame: number): Camera => {
  const drift = move.drift ?? DEFAULT_DRIFT;
  const held = Math.max(0, frame - move.end);
  const target = { ...move.to, s: move.to.s * (1 + drift * held) };

  if (move.kind === "cut") {
    return target;
  }

  const ease = move.easing ?? (move.kind === "travel" ? TRAVEL_EASE : GLIDE_EASE);
  const p = interpolate(frame, [move.start, move.end], [0, 1], { ...clamp, easing: ease });
  const q = scaleProgress(frame, move);

  const logFrom = Math.log(from.s);
  const logTo = Math.log(target.s);
  let logS = lerp(logFrom, logTo, q);

  if (move.kind === "travel") {
    const dip = Math.max(0, Math.log(Math.min(from.s, move.to.s)) - Math.log(travelDipScale(from, move.to)));
    logS -= dip * Math.sin(Math.PI * p) ** 1.4;
  }

  return { x: lerp(from.x, target.x, p), y: lerp(from.y, target.y, p), s: Math.exp(logS) };
};

/**
 * Builds the camera function for a list of moves. The camera before the first
 * move comes from `opening`, and each move starts from wherever the previous
 * one had got to — so a move can begin while the last settle is still ringing
 * without a jump.
 */
export const createCamera = (
  opening: (frame: number) => Camera,
  moves: readonly Move[],
): ((frame: number) => Camera) => {
  const sorted = [...moves].sort((a, b) => a.start - b.start);
  const origins: Camera[] = [];
  sorted.forEach((move, index) => {
    const origin =
      index === 0
        ? opening(move.start)
        : evaluateMove(sorted[index - 1], origins[index - 1], move.start);
    origins.push(origin);
  });

  return (frame: number) => {
    let active = -1;
    for (let i = 0; i < sorted.length; i += 1) {
      if (frame >= sorted[i].start) {
        active = i;
      }
    }
    return active === -1 ? opening(frame) : evaluateMove(sorted[active], origins[active], frame);
  };
};

/** Where a world point lands on screen under a camera. */
export const toScreen = (camera: Camera, point: Point): Point => ({
  x: (point.x - camera.x) * camera.s + WIDTH / 2,
  y: (point.y - camera.y) * camera.s + HEIGHT / 2,
});

/** CSS transform for the world layer (transform-origin 0 0). */
export const worldTransform = (camera: Camera): string => {
  const tx = WIDTH / 2 - camera.x * camera.s;
  const ty = HEIGHT / 2 - camera.y * camera.s;
  return `translate3d(${tx}px, ${ty}px, 0) scale(${camera.s})`;
};

/**
 * On-screen motion of the frame, in pixels per frame: the pan of the centre
 * point plus the radial smear a zoom gives the frame edges.
 */
export const screenVelocity = (
  cameraAt: (frame: number) => Camera,
  frame: number,
): { x: number; y: number; zoom: number } => {
  const a = cameraAt(frame - 0.5);
  const b = cameraAt(frame + 0.5);
  const s = (a.s + b.s) / 2;
  return {
    x: (b.x - a.x) * s,
    y: (b.y - a.y) * s,
    zoom: Math.abs(Math.log(b.s / a.s)),
  };
};
