import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ZoomThroughProps = {
  maxScale?: number;
  blurPeak?: number;
};

const ZoomThroughPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ZoomThroughProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { maxScale = 2.4, blurPeak = 18 },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress, 0.6)
    : layeredExitProgress(presentationProgress, 0.58);
  const motion = isEntering ? layered.motion : 1 - layered.motion;

  const style = useMemo(() => {
    const scale = isEntering
      ? interpolate(motion, [0, 1], [maxScale, 1])
      : interpolate(motion, [0, 1], [1, maxScale * 0.85]);
    const blur = interpolate(motion, [0, 0.45, 1], [blurPeak, blurPeak * 0.4, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      opacity: layered.opacity,
      transform: `scale(${scale})`,
      filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
    };
  }, [blurPeak, isEntering, layered.opacity, maxScale, motion]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export function zoomThrough(
  props: ZoomThroughProps = {},
): TransitionPresentation<ZoomThroughProps> {
  return { component: ZoomThroughPresentation, props };
}

export type TransitionZoomThroughConfig = {
  durationInFrames?: number;
  maxScale?: number;
  blurPeak?: number;
  variant?: TransitionVariant;
};

export function transitionZoomThrough({
  durationInFrames = 20,
  maxScale = 2.4,
  blurPeak = 18,
  variant = "spring",
}: TransitionZoomThroughConfig = {}) {
  return {
    presentation: zoomThrough({ maxScale, blurPeak }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionZoomThroughDuration(
  config: TransitionZoomThroughConfig = {},
  fps: number,
): number {
  return transitionZoomThrough(config).timing.getDurationInFrames({ fps });
}
