import { slide } from "@remotion/transitions/slide";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type SlideDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type TransitionSlideConfig = {
  durationInFrames?: number;
  direction?: SlideDirection;
  variant?: TransitionVariant;
};

/** Slide transition config for use with TransitionSeries.Transition */
export function transitionSlide({
  durationInFrames = 22,
  direction = "from-left",
  variant = "editorial",
}: TransitionSlideConfig = {}) {
  return {
    presentation: slide({ direction }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

/** Total overlap frames consumed by a slide transition */
export function getTransitionSlideDuration(
  config: TransitionSlideConfig = {},
  fps: number,
): number {
  return transitionSlide(config).timing.getDurationInFrames({ fps });
}
