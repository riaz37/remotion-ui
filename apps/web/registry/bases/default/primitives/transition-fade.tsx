import { fade } from "@remotion/transitions/fade";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type TransitionFadeConfig = {
  durationInFrames?: number;
  /** `spring` uses organic motion; `editorial` ease-out; `linear` is constant speed */
  variant?: TransitionVariant;
};

/** Fade transition config for use with TransitionSeries.Transition */
export function transitionFade({
  durationInFrames = 18,
  variant = "editorial",
}: TransitionFadeConfig = {}) {
  return {
    presentation: fade(),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

/** Total overlap frames consumed by a transition (for composition duration math) */
export function getTransitionFadeDuration(
  config: TransitionFadeConfig = {},
  fps: number,
): number {
  return transitionFade(config).timing.getDurationInFrames({ fps });
}
