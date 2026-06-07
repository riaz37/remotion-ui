import { linearTiming, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { springSmooth } from "@/remotion/lib/springs";

export type WipeDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type TransitionWipeConfig = {
  durationInFrames?: number;
  direction?: WipeDirection;
  variant?: "linear" | "spring";
};

/** Wipe transition config for use with TransitionSeries.Transition */
export function transitionWipe({
  durationInFrames = 20,
  direction = "from-left",
  variant = "linear",
}: TransitionWipeConfig = {}) {
  return {
    presentation: wipe({ direction }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

export function getTransitionWipeDuration(
  config: TransitionWipeConfig = {},
  fps: number,
): number {
  return transitionWipe(config).timing.getDurationInFrames({ fps });
}
