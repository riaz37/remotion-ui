import { linearTiming, springTiming } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { springSmooth } from "@/remotion/lib/springs";

export type TransitionClockWipeConfig = {
  durationInFrames?: number;
  width: number;
  height: number;
  variant?: "linear" | "spring";
};

/** Clock wipe transition config for use with TransitionSeries.Transition */
export function transitionClockWipe({
  durationInFrames = 24,
  width,
  height,
  variant = "linear",
}: TransitionClockWipeConfig) {
  return {
    presentation: clockWipe({ width, height }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

export function getTransitionClockWipeDuration(
  config: TransitionClockWipeConfig,
  fps: number,
): number {
  return transitionClockWipe(config).timing.getDurationInFrames({ fps });
}
