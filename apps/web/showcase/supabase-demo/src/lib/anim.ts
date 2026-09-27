import type { CSSProperties } from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../timeline";

/**
 * anim.ts — the few motion primitives every panel shares.
 *
 * Everything is a pure function of the frame. Springs get their config from
 * one place so the film has one feel instead of seven.
 */

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const SPRINGS = {
  /** UI settling into place: no bounce, quick. */
  settle: { damping: 200, stiffness: 180, mass: 0.8 },
  /** Things that land: one small overshoot. */
  land: { damping: 13, stiffness: 170, mass: 0.7 },
  /** Drops with a visible bounce. */
  drop: { damping: 10, stiffness: 150, mass: 0.8 },
} as const;

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

export const ramp = (
  frame: number,
  from: number,
  to: number,
  easing: (t: number) => number = ease.out,
): number => interpolate(frame, [from, to], [0, 1], { ...CLAMP, easing });

export const settle = (frame: number, at: number, durationInFrames = 14): number =>
  spring({ frame: frame - at, fps: FPS, config: SPRINGS.settle, durationInFrames });

export const land = (frame: number, at: number): number =>
  spring({ frame: frame - at, fps: FPS, config: SPRINGS.land });

export const drop = (frame: number, at: number): number =>
  spring({ frame: frame - at, fps: FPS, config: SPRINGS.drop });

/** Fade + rise + a touch of blur: the film's standard entrance. */
export const riseIn = (progress: number, distance = 24): CSSProperties => ({
  opacity: interpolate(progress, [0, 0.6], [0, 1], CLAMP),
  transform: `translateY(${(1 - progress) * distance}px)`,
  filter: progress < 0.98 ? `blur(${(1 - Math.min(1, progress)) * 8}px)` : undefined,
});

/** The first `n` characters of `text` typed from `start` at `perFrame` chars/frame. */
export const typed = (text: string, frame: number, start: number, perFrame: number): string =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * perFrame)));

export const formatInt = (value: number): string =>
  Math.round(value).toLocaleString("en-US");

/** A number that counts from `from` to `to` with an ease-out. */
export const countUp = (
  frame: number,
  start: number,
  end: number,
  from: number,
  to: number,
): number => interpolate(frame, [start, end], [from, to], { ...CLAMP, easing: ease.out });

/** Caret blink: on for 16 frames, off for 14, always on while typing. */
export const caretOn = (frame: number, typingUntil = -1): boolean =>
  frame <= typingUntil + 2 || Math.floor(frame / 15) % 2 === 0;
