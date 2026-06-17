import { clockWipe } from "@remotion/transitions/clock-wipe";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type TransitionClockWipeConfig = {
  durationInFrames?: number;
  width: number;
  height: number;
  variant?: TransitionVariant;
};

/** Clock wipe transition config for use with TransitionSeries.Transition */
export function transitionClockWipe({
  durationInFrames = 26,
  width,
  height,
  variant = "editorial",
}: TransitionClockWipeConfig) {
  return {
    presentation: clockWipe({ width, height }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionClockWipeDuration(
  config: TransitionClockWipeConfig,
  fps: number,
): number {
  return transitionClockWipe(config).timing.getDurationInFrames({ fps });
}
