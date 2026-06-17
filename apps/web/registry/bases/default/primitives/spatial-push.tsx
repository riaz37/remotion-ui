import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type SpatialPushDirection = "from-left" | "from-right";

export type SpatialPushProps = {
  direction?: SpatialPushDirection;
  perspective?: number;
  pushDepth?: number;
};

const SpatialPushPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<SpatialPushProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = "from-left", perspective = 1200, pushDepth = 0.42 },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress, 0.68)
    : layeredExitProgress(presentationProgress, 0.62);
  const motion = isEntering ? layered.motion : 1 - layered.motion;
  const opacity = layered.opacity;
  const sign = direction === "from-left" ? -1 : 1;

  const style = useMemo(() => {
    const translateX = sign * (1 - motion) * pushDepth * 100;
    const rotateY = sign * (1 - motion) * 18;
    const scale = isEntering
      ? 0.88 + motion * 0.12
      : 1 - (1 - motion) * 0.14;
    const blur = interpolate(motion, [0, 1], [14, 0]);

    return {
      opacity,
      filter: `blur(${blur}px)`,
      transform: `perspective(${perspective}px) translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
      transformOrigin: direction === "from-left" ? "left center" : "right center",
    };
  }, [direction, isEntering, motion, opacity, perspective, pushDepth, sign]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Perspective push transition for TransitionSeries */
export function spatialPush(
  props: SpatialPushProps = {},
): TransitionPresentation<SpatialPushProps> {
  return {
    component: SpatialPushPresentation,
    props,
  };
}

export type TransitionSpatialPushConfig = {
  durationInFrames?: number;
  direction?: SpatialPushDirection;
  perspective?: number;
  pushDepth?: number;
  variant?: TransitionVariant;
};

export function transitionSpatialPush({
  durationInFrames = 24,
  direction = "from-left",
  perspective = 1200,
  pushDepth = 0.42,
  variant = "editorial",
}: TransitionSpatialPushConfig = {}) {
  return {
    presentation: spatialPush({ direction, perspective, pushDepth }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionSpatialPushDuration(
  config: TransitionSpatialPushConfig = {},
  fps: number,
): number {
  return transitionSpatialPush(config).timing.getDurationInFrames({ fps });
}
