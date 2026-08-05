import type { CSSProperties, ReactNode } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  type SpringConfig,
} from "remotion";
import { springBouncy, springSmooth, springSnappy } from "./springs";
import { EASING_ENTER, EASING_EXIT } from "./timing";

/**
 * One motion contract behind every enter/exit primitive.
 *
 * Two rules do most of the work:
 *
 * 1. **Light leads the move.** Opacity finishes at ~55% of an entrance, so the
 *    last third of the travel happens on a fully opaque element. Cross-fading
 *    for the whole move is what makes an animation read as a dissolve rather
 *    than an arrival.
 * 2. **An exit is not an entrance played backwards.** It is shorter (70% of the
 *    enter duration), it travels less (60% of the distance), and it accelerates
 *    away instead of decelerating into place.
 *
 * Exits are also automatic: inside a `<Sequence durationInFrames={n}>`,
 * `useVideoConfig().durationInFrames` is that window, so `exit` alone is enough
 * to land the element out exactly at the end of its slot.
 */

export type SpringPreset = "smooth" | "snappy" | "bouncy";

/** `true` picks the snappy preset; an object overrides fields on it. */
export type MotionSpring = boolean | SpringPreset | Partial<SpringConfig>;

const SPRING_PRESETS: Record<SpringPreset, SpringConfig> = {
  smooth: springSmooth,
  snappy: springSnappy,
  bouncy: springBouncy,
};

export function resolveSpringConfig(value: MotionSpring): SpringConfig {
  if (value === true || value === false) return springSnappy;
  if (typeof value === "string") return SPRING_PRESETS[value] ?? springSnappy;
  return { ...springSnappy, ...value };
}

/**
 * Light snaps, geometry glides.
 *
 * `EASING_ENTER` is an expo-out: it is ~90% resolved a third of the way in,
 * which is right for opacity but throws away most of a transform — a hinge or
 * a defocus is over before the element is even visible. The transform channel
 * decelerates on a cubic instead, so the stated duration is the duration the
 * eye actually sees.
 */
const EASING_ARRIVE = Easing.bezier(0.33, 1, 0.68, 1);

/** Opacity is complete this far into an entrance. */
const ENTER_OPACITY_LEAD = 0.55;
/** Opacity is gone this far into an exit — the tail of the travel is unseen. */
const EXIT_OPACITY_LEAD = 0.7;
/** Exit duration as a share of the enter duration, when not given. */
const EXIT_DURATION_RATIO = 0.7;
const MIN_EXIT_FRAMES = 6;
/** Exit travel as a share of the enter distance. */
const DEFAULT_EXIT_TRAVEL = 0.6;

export const DEFAULT_ENTER_FRAMES = 30;

/** Exit length a primitive uses when it is not given one. */
export function defaultExitFrames(durationInFrames: number): number {
  return Math.max(
    MIN_EXIT_FRAMES,
    Math.round(durationInFrames * EXIT_DURATION_RATIO),
  );
}

export type EnterExitOptions = {
  /** Length of the entrance in frames. */
  durationInFrames?: number;
  /** Frames to wait before the entrance starts. */
  delayInFrames?: number;
  /** Drive the entrance with a spring instead of the ease-out curve. */
  spring?: MotionSpring;
  /** Animate back out. Lands on the last frame of the surrounding Sequence. */
  exit?: boolean;
  /** Length of the exit. Defaults to 70% of `durationInFrames`. */
  exitInFrames?: number;
  /** Frame the exit starts on. Overrides the automatic end-of-window timing. */
  exitAtInFrames?: number;
  /** Share of the enter distance the exit travels. */
  exitTravel?: number;
  /** `reverse` leaves the way it came in, `continue` carries on through. */
  exitDirection?: "reverse" | "continue";
};

/** Props every wrapper primitive accepts on top of its own options. */
export type MotionPrimitiveProps = EnterExitOptions & {
  children: ReactNode;
  /** Fill the parent's width instead of shrink-wrapping the child. */
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

export type MotionState = {
  /** 0 at the start, 1 at rest, back to 0 on the way out. May overshoot 1. */
  motion: number;
  /** How far from rest the element still is — multiply distances by this. */
  displace: number;
  /** Opacity channel. Leads the transform in and out. */
  opacity: number;
  /** Direction multiplier for the displacement, -1 while exiting forwards. */
  sign: 1 | -1;
  /** True from the first frame of the exit onwards. */
  exiting: boolean;
  /** Eased 0→1 across the exit window. */
  exitProgress: number;
  /** Linear 0→1 across the entrance window, before easing. */
  enterTime: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Resolves the enter and exit channels for one element.
 * Every wrapper primitive in the registry is a different way of spending the
 * `motion`/`displace`/`opacity` values this returns.
 */
export function useEnterExit({
  durationInFrames = DEFAULT_ENTER_FRAMES,
  delayInFrames = 0,
  spring: springProp,
  exit = false,
  exitInFrames,
  exitAtInFrames,
  exitTravel = DEFAULT_EXIT_TRAVEL,
  exitDirection = "reverse",
}: EnterExitOptions): MotionState {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: windowFrames } = useVideoConfig();

  const duration = Math.max(1, Math.round(durationInFrames));
  const delay = Math.max(0, Math.round(delayInFrames));

  const enterTime = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    clamp,
  );

  const enterMotion = springProp
    ? spring({
        frame,
        fps,
        config: resolveSpringConfig(springProp),
        delay,
        durationInFrames: duration,
      })
    : interpolate(enterTime, [0, 1], [0, 1], {
        easing: EASING_ARRIVE,
        ...clamp,
      });

  const enterOpacity = interpolate(
    enterTime,
    [0, ENTER_OPACITY_LEAD],
    [0, 1],
    { easing: EASING_ENTER, ...clamp },
  );

  const exitFrames =
    exitInFrames === undefined
      ? defaultExitFrames(duration)
      : Math.max(MIN_EXIT_FRAMES, Math.round(exitInFrames));
  const hasWindow = Number.isFinite(windowFrames);
  const requested =
    exitAtInFrames ?? (hasWindow ? windowFrames - exitFrames : null);
  const wantsExit =
    exit || exitInFrames !== undefined || exitAtInFrames !== undefined;

  if (!wantsExit || requested === null) {
    return {
      motion: enterMotion,
      displace: 1 - enterMotion,
      opacity: enterOpacity,
      sign: 1,
      exiting: false,
      exitProgress: 0,
      enterTime,
    };
  }

  /* An exit that starts before the entrance has landed reads as a stutter, so
   * it is pushed behind the entrance rather than overlapping it. */
  const exitStart = Math.max(requested, delay + duration);
  const exitTime = interpolate(
    frame,
    [exitStart, exitStart + exitFrames],
    [0, 1],
    clamp,
  );
  const exitProgress = interpolate(exitTime, [0, 1], [0, 1], {
    easing: EASING_EXIT,
    ...clamp,
  });
  const exitOpacity = interpolate(
    exitTime,
    [0, EXIT_OPACITY_LEAD],
    [1, 0],
    { easing: EASING_EXIT, ...clamp },
  );
  const exiting = frame >= exitStart;

  return {
    motion: exiting ? 1 - exitProgress : enterMotion,
    displace: exiting ? exitProgress * exitTravel : 1 - enterMotion,
    opacity: enterOpacity * exitOpacity,
    sign: exiting && exitDirection === "continue" ? -1 : 1,
    exiting,
    exitProgress,
    enterTime,
  };
}

export type TransformOrigin =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

/** Named origins map straight to CSS, `center` included, for prop ergonomics. */
export function resolveOrigin(origin: TransformOrigin): string {
  return origin === "center" ? "center center" : origin;
}
