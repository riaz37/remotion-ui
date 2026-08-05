import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ZoomThroughDirection = "in" | "out";

export type ZoomThroughProps = {
  /** Scale the camera travels through. 2.4 pushes past the frame edge. */
  maxScale?: number;
  blurPeak?: number;
  /** `in` pushes the camera through the frame; `out` pulls back from it. */
  direction?: ZoomThroughDirection;
};

const ZoomThroughPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ZoomThroughProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { maxScale = 2.4, blurPeak = 18, direction = "in" },
}) => {
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: presentationDirection === "entering" ? 0.6 : 0.58,
    fade: true,
  });

  const style = useMemo(() => {
    // Both scenes travel the same way through the camera: the outgoing one
    // keeps pushing past the lens while the incoming one arrives out of it.
    const reach = phase.isEntering ? maxScale : 1 + (maxScale - 1) * 0.85;
    const zoomed = 1 + (reach - 1) * phase.displace;
    const scale = direction === "in" ? zoomed : 1 / zoomed;
    const blur = interpolate(phase.displace, [0, 1], [0, blurPeak], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      opacity: phase.opacity,
      scale,
      filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
    };
  }, [
    blurPeak,
    direction,
    maxScale,
    phase.displace,
    phase.isEntering,
    phase.opacity,
  ]);

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
  direction?: ZoomThroughDirection;
  variant?: TransitionVariant;
};

export function transitionZoomThrough({
  durationInFrames = 20,
  maxScale = 2.4,
  blurPeak = 18,
  direction = "in",
  variant = "spring",
}: TransitionZoomThroughConfig = {}) {
  return {
    presentation: zoomThrough({ maxScale, blurPeak, direction }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionZoomThroughDuration(
  config: TransitionZoomThroughConfig = {},
  fps: number,
): number {
  return transitionZoomThrough(config).timing.getDurationInFrames({ fps });
}
