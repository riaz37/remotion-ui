import { Easing, interpolate } from "remotion";

export const DEFAULT_FPS = 30;

/** Crisp UI entrance curve from Remotion timing best practices */
export const EASING_ENTER = Easing.bezier(0.16, 1, 0.3, 1);

/** Exit curve — accelerates away (Easing.in) */
export const EASING_EXIT = Easing.in(Easing.cubic);

export function secondsToFrames(seconds: number, fps = DEFAULT_FPS): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps = DEFAULT_FPS): number {
  return frames / fps;
}

export function staggerDelay(
  index: number,
  staggerInFrames: number,
  baseDelayInFrames = 0,
): number {
  return baseDelayInFrames + index * staggerInFrames;
}

/** Normalized 0→1 enter progress with default ease-out curve */
export function enterProgress(
  frame: number,
  delayInFrames: number,
  durationInFrames: number,
  easing = EASING_ENTER,
): number {
  return interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
}

/** Normalized 0→1 exit progress with default ease-in curve */
export function exitProgress(
  frame: number,
  delayInFrames: number,
  durationInFrames: number,
  easing = EASING_EXIT,
): number {
  return interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
}
