import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type DirectionalWipeDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type DirectionalWipeProps = {
  direction?: DirectionalWipeDirection;
  edgeSoftness?: number;
  depth?: number;
};

function clipForDirection(
  direction: DirectionalWipeDirection,
  progress: number,
  softness: number,
): string {
  const edge = (1 - progress) * 100;
  const feather = softness * 8;

  switch (direction) {
    case "from-left":
      return `inset(0 ${edge + feather}% 0 ${Math.max(0, edge - feather)}%)`;
    case "from-right":
      return `inset(0 ${Math.max(0, edge - feather)}% 0 ${edge + feather}%)`;
    case "from-top":
      return `inset(${Math.max(0, edge - feather)}% 0 ${edge + feather}% 0)`;
    case "from-bottom":
      return `inset(${edge + feather}% 0 ${Math.max(0, edge - feather)}% 0)`;
  }
}

function offsetForDirection(
  direction: DirectionalWipeDirection,
  motion: number,
  depth: number,
): { x: number; y: number; scale: number } {
  const travel = (1 - motion) * depth * 100;
  switch (direction) {
    case "from-left":
      return { x: -travel, y: 0, scale: 0.96 + motion * 0.04 };
    case "from-right":
      return { x: travel, y: 0, scale: 0.96 + motion * 0.04 };
    case "from-top":
      return { x: 0, y: -travel, scale: 0.96 + motion * 0.04 };
    case "from-bottom":
      return { x: 0, y: travel, scale: 0.96 + motion * 0.04 };
  }
}

const DirectionalWipePresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<DirectionalWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = "from-left", edgeSoftness = 0.35, depth = 0.28 },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress)
    : layeredExitProgress(presentationProgress);
  const motion = isEntering ? layered.motion : 1 - layered.motion;
  const opacity = layered.opacity;

  const style = useMemo(() => {
    const offset = offsetForDirection(direction, motion, depth);
    const clip = clipForDirection(direction, motion, edgeSoftness);
    const blur = interpolate(motion, [0, 1], [10, 0]);

    return {
      opacity,
      clipPath: clip,
      filter: `blur(${blur}px)`,
      translate: `${offset.x}% ${offset.y}%`,
      scale: offset.scale,
    };
  }, [depth, direction, edgeSoftness, motion, opacity]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Directional wipe with depth and soft edge for TransitionSeries */
export function directionalWipe(
  props: DirectionalWipeProps = {},
): TransitionPresentation<DirectionalWipeProps> {
  return {
    component: DirectionalWipePresentation,
    props,
  };
}

export type TransitionDirectionalWipeConfig = {
  durationInFrames?: number;
  direction?: DirectionalWipeDirection;
  edgeSoftness?: number;
  depth?: number;
  variant?: TransitionVariant;
};

export function transitionDirectionalWipe({
  durationInFrames = 22,
  direction = "from-left",
  edgeSoftness = 0.35,
  depth = 0.28,
  variant = "editorial",
}: TransitionDirectionalWipeConfig = {}) {
  return {
    presentation: directionalWipe({ direction, edgeSoftness, depth }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionDirectionalWipeDuration(
  config: TransitionDirectionalWipeConfig = {},
  fps: number,
): number {
  return transitionDirectionalWipe(config).timing.getDurationInFrames({ fps });
}
