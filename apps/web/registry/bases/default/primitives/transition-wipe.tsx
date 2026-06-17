import { wipe } from "@remotion/transitions/wipe";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type WipeDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type TransitionWipeConfig = {
  durationInFrames?: number;
  direction?: WipeDirection;
  variant?: TransitionVariant;
};

/** Wipe transition config for use with TransitionSeries.Transition */
export function transitionWipe({
  durationInFrames = 22,
  direction = "from-left",
  variant = "editorial",
}: TransitionWipeConfig = {}) {
  return {
    presentation: wipe({ direction }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionWipeDuration(
  config: TransitionWipeConfig = {},
  fps: number,
): number {
  return transitionWipe(config).timing.getDurationInFrames({ fps });
}
