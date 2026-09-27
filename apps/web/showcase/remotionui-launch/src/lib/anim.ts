import type { CSSProperties } from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../timeline";

/** anim.ts: the motion vocabulary every layer shares. Pure functions of the frame. */

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

export const ramp = (frame: number, from: number, to: number, easing: (t: number) => number = ease.out): number =>
  interpolate(frame, [from, to], [0, 1], { ...CLAMP, easing });

export const settle = (frame: number, at: number, durationInFrames = 14): number =>
  spring({ frame: frame - at, fps: FPS, config: { damping: 200, stiffness: 180, mass: 0.8 }, durationInFrames });

export const land = (frame: number, at: number): number =>
  spring({ frame: frame - at, fps: FPS, config: { damping: 13, stiffness: 170, mass: 0.7 } });

/** Fade + rise + a touch of blur: the film's standard entrance. */
export const riseIn = (progress: number, distance = 24): CSSProperties => ({
  opacity: interpolate(progress, [0, 0.6], [0, 1], CLAMP),
  transform: `translateY(${(1 - progress) * distance}px)`,
  filter: progress < 0.98 ? `blur(${(1 - Math.min(1, progress)) * 8}px)` : undefined,
});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
