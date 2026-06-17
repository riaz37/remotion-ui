import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ChromaticAberrationWipeProps = {
  intensity?: number;
};

const ChromaticPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ChromaticAberrationWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { intensity = 12 },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress, 0.55)
    : layeredExitProgress(presentationProgress, 0.5);
  const motion = isEntering ? layered.motion : 1 - layered.motion;
  const peak = interpolate(motion, [0.35, 0.5, 0.65], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offset = peak * intensity;
  const slideX = (1 - motion) * (isEntering ? 100 : -100);

  const style = useMemo(
    () => ({
      opacity: layered.opacity,
      transform: `translateX(${slideX}%)`,
      filter: peak > 0.01 ? `drop-shadow(${offset}px 0 #f472b6) drop-shadow(${-offset}px 0 #2dd4bf)` : undefined,
    }),
    [layered.opacity, offset, peak, slideX],
  );

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export function chromaticAberrationWipe(
  props: ChromaticAberrationWipeProps = {},
): TransitionPresentation<ChromaticAberrationWipeProps> {
  return { component: ChromaticPresentation, props };
}

export type TransitionChromaticAberrationWipeConfig = {
  durationInFrames?: number;
  intensity?: number;
  variant?: TransitionVariant;
};

export function transitionChromaticAberrationWipe({
  durationInFrames = 14,
  intensity = 12,
  variant = "editorial",
}: TransitionChromaticAberrationWipeConfig = {}) {
  return {
    presentation: chromaticAberrationWipe({ intensity }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionChromaticAberrationWipeDuration(
  config: TransitionChromaticAberrationWipeConfig = {},
  fps: number,
): number {
  return transitionChromaticAberrationWipe(config).timing.getDurationInFrames({ fps });
}
