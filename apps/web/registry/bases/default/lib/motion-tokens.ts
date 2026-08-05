import { Easing } from "remotion";
import { EASING_ENTER, EASING_EXIT, secondsToFrames } from "./timing";

/** Named frame durations — pair with `springs.ts` or `enterProgress()` */
export const DURATION = {
  fast: secondsToFrames(0.4),
  normal: secondsToFrames(0.8),
  slow: secondsToFrames(1.2),
} as const;

export const DELAY = {
  none: 0,
  short: secondsToFrames(0.15),
  medium: secondsToFrames(0.3),
} as const;

export const STAGGER = {
  tight: 4,
  normal: 8,
  relaxed: 12,
} as const;

/**
 * Emphasis scale steps. One word popping inside a line of text carries a lot
 * less headroom than a card lifting off a page, so emphasis is a named ramp
 * rather than a per-component magic number — pair with `EASING.pop`.
 */
export const EMPHASIS = {
  /** Type-level accent: a highlighted word inside running copy. */
  subtle: 1.05,
  /** Standalone element that owns its own line. */
  medium: 1.1,
  /** Hero beat — one per scene at most. */
  strong: 1.18,
} as const;

/**
 * Copy-paste Bézier curves from Remotion timing guidance.
 * Curves are shared with `timing.ts` so a component picks the same motion
 * whether it imports the token object or the standalone curve.
 */
export const EASING = {
  /** Strong ease-out — entrances, decelerates into place */
  enter: EASING_ENTER,
  /** Ease-in — exits accelerate away. Never ease-out an exit. */
  exit: EASING_EXIT,
  /** Balanced ease-in-out — editorial holds */
  editorial: Easing.bezier(0.45, 0, 0.55, 1),
  /** Slight overshoot — emphasis pops */
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;
