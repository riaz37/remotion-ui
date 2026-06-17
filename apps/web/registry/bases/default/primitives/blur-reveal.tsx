import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type BlurRevealProps = {
  maxBlur?: number;
  shouldBlurOutExitingScene?: boolean;
};

const BlurRevealPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<BlurRevealProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { maxBlur = 24, shouldBlurOutExitingScene = true },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress, 0.74)
    : layeredExitProgress(presentationProgress, 0.7);
  const motion = isEntering ? layered.motion : 1 - layered.motion;
  const opacity = isEntering
    ? layered.opacity
    : shouldBlurOutExitingScene
      ? layered.opacity
      : 1;

  const style = useMemo(() => {
    const blur = isEntering
      ? interpolate(motion, [0, 0.85, 1], [maxBlur, maxBlur * 0.25, 0])
      : shouldBlurOutExitingScene
        ? interpolate(motion, [0, 0.2, 1], [0, maxBlur * 0.35, maxBlur])
        : 0;
    const scale = isEntering
      ? interpolate(motion, [0, 1], [1.03, 1])
      : shouldBlurOutExitingScene
        ? interpolate(motion, [0, 1], [1, 0.98])
        : 1;

    return {
      opacity,
      filter: `blur(${blur}px)`,
      scale,
    };
  }, [isEntering, maxBlur, motion, opacity, shouldBlurOutExitingScene]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Blur + opacity reveal presentation for TransitionSeries */
export function blurReveal(
  props: BlurRevealProps = {},
): TransitionPresentation<BlurRevealProps> {
  return {
    component: BlurRevealPresentation,
    props,
  };
}

export type TransitionBlurRevealConfig = {
  durationInFrames?: number;
  maxBlur?: number;
  variant?: TransitionVariant;
  shouldBlurOutExitingScene?: boolean;
};

/** Blur reveal transition config for use with TransitionSeries.Transition */
export function transitionBlurReveal({
  durationInFrames = 22,
  maxBlur = 24,
  variant = "editorial",
  shouldBlurOutExitingScene = true,
}: TransitionBlurRevealConfig = {}) {
  return {
    presentation: blurReveal({ maxBlur, shouldBlurOutExitingScene }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionBlurRevealDuration(
  config: TransitionBlurRevealConfig = {},
  fps: number,
): number {
  return transitionBlurReveal(config).timing.getDurationInFrames({ fps });
}
