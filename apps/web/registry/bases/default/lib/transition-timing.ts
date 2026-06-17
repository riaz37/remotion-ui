import { linearTiming, springTiming } from "@remotion/transitions";
import { Easing, interpolate } from "remotion";
import { springSmooth } from "./springs";
import { EASING_ENTER, EASING_EXIT } from "./timing";

export type TransitionVariant = "linear" | "spring" | "editorial";

export function resolveTransitionTiming({
  durationInFrames,
  variant = "editorial",
}: {
  durationInFrames: number;
  variant?: TransitionVariant;
}) {
  if (variant === "spring") {
    return springTiming({ config: springSmooth, durationInFrames });
  }

  return linearTiming({
    durationInFrames,
    easing: variant === "editorial" ? EASING_ENTER : undefined,
  });
}

/** Layered enter curve — blur/scale leads, opacity follows */
export function layeredEnterProgress(
  progress: number,
  lead = 0.72,
): { motion: number; opacity: number } {
  const motion = interpolate(progress, [0, lead, 1], [0, 1, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 0.22, 1], [0, 0.35, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { motion, opacity };
}

/** Layered exit curve — opacity drops before motion completes */
export function layeredExitProgress(
  progress: number,
  trail = 0.68,
): { motion: number; opacity: number } {
  const motion = interpolate(progress, [0, 1 - trail, 1], [0, 0, 1], {
    easing: EASING_EXIT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 0.45, 1], [1, 0.2, 0], {
    easing: EASING_EXIT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { motion, opacity };
}
