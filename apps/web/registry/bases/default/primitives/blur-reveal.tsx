import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type BlurRevealProps = {
  maxBlur?: number;
  /** Scale headroom the blur rides on. 0 keeps the frame perfectly still. */
  scaleBy?: number;
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
  passedProps: {
    maxBlur = 24,
    scaleBy = 0.03,
    shouldBlurOutExitingScene = true,
  },
}) => {
  const isEntering = presentationDirection === "entering";
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: isEntering ? 0.74 : 0.7,
    fade: true,
  });
  const isHeld = !isEntering && !shouldBlurOutExitingScene;

  const style = useMemo(() => {
    if (isHeld) {
      return { opacity: 1 };
    }

    // `displace` is 0 whenever the scene is at rest, so a scene that is not
    // mid-transition renders untouched — no blur, no scale.
    return {
      opacity: phase.opacity,
      filter:
        phase.displace > 0.002
          ? `blur(${(phase.displace * maxBlur).toFixed(2)}px)`
          : undefined,
      scale: phase.isEntering
        ? 1 + phase.displace * scaleBy
        : 1 - phase.displace * scaleBy * 0.66,
    };
  }, [
    isHeld,
    maxBlur,
    phase.displace,
    phase.isEntering,
    phase.opacity,
    scaleBy,
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
  scaleBy?: number;
  variant?: TransitionVariant;
  shouldBlurOutExitingScene?: boolean;
};

/** Blur reveal transition config for use with TransitionSeries.Transition */
export function transitionBlurReveal({
  durationInFrames = 22,
  maxBlur = 24,
  scaleBy = 0.03,
  variant = "editorial",
  shouldBlurOutExitingScene = true,
}: TransitionBlurRevealConfig = {}) {
  return {
    presentation: blurReveal({ maxBlur, scaleBy, shouldBlurOutExitingScene }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionBlurRevealDuration(
  config: TransitionBlurRevealConfig = {},
  fps: number,
): number {
  return transitionBlurReveal(config).timing.getDurationInFrames({ fps });
}
