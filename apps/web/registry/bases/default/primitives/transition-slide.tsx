import { linearTiming, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { springSmooth } from "@/remotion/lib/springs";

export type SlideDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type TransitionSlideConfig = {
  durationInFrames?: number;
  direction?: SlideDirection;
  variant?: "linear" | "spring";
};

/** Slide transition config for use with TransitionSeries.Transition */
export function transitionSlide({
  durationInFrames = 20,
  direction = "from-left",
  variant = "linear",
}: TransitionSlideConfig = {}) {
  return {
    presentation: slide({ direction }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

/** Total overlap frames consumed by a slide transition */
export function getTransitionSlideDuration(
  config: TransitionSlideConfig = {},
  fps: number,
): number {
  return transitionSlide(config).timing.getDurationInFrames({ fps });
}
