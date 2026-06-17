import type { TransitionPresentation } from "@remotion/transitions";
import { linearTiming, springTiming } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { springSmooth } from "@/remotion/lib/springs";

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

  const style = useMemo(() => {
    const opacity = isEntering
      ? presentationProgress
      : shouldBlurOutExitingScene
        ? 1 - presentationProgress
        : 1;

    const blur = isEntering
      ? interpolate(presentationProgress, [0, 1], [maxBlur, 0])
      : shouldBlurOutExitingScene
        ? interpolate(presentationProgress, [0, 1], [0, maxBlur])
        : 0;

    return {
      opacity,
      filter: `blur(${blur}px)`,
    };
  }, [
    isEntering,
    maxBlur,
    presentationProgress,
    shouldBlurOutExitingScene,
  ]);

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
  variant?: "linear" | "spring";
  shouldBlurOutExitingScene?: boolean;
};

/** Blur reveal transition config for use with TransitionSeries.Transition */
export function transitionBlurReveal({
  durationInFrames = 20,
  maxBlur = 24,
  variant = "linear",
  shouldBlurOutExitingScene = true,
}: TransitionBlurRevealConfig = {}) {
  return {
    presentation: blurReveal({ maxBlur, shouldBlurOutExitingScene }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

export function getTransitionBlurRevealDuration(
  config: TransitionBlurRevealConfig = {},
  fps: number,
): number {
  return transitionBlurReveal(config).timing.getDurationInFrames({ fps });
}
