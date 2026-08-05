import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type SpatialPushDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type SpatialPushProps = {
  direction?: SpatialPushDirection;
  perspective?: number;
  /**
   * Share of the frame each scene travels, 0→1. Anything below 1 leaves part
   * of the frame uncovered mid-push, so only lower it over a solid backdrop.
   */
  pushDepth?: number;
  /**
   * Degrees each panel rotates away from the camera. Off by default: rotating
   * a full-frame panel in 3D pulls one edge in, and the frame it uncovers is
   * bare background. Raise it only over a backdrop, or with `pushDepth < 1`.
   */
  tilt?: number;
};

const AXIS: Record<SpatialPushDirection, { axis: "x" | "y"; sign: number }> = {
  "from-left": { axis: "x", sign: -1 },
  "from-right": { axis: "x", sign: 1 },
  "from-top": { axis: "y", sign: -1 },
  "from-bottom": { axis: "y", sign: 1 },
};

const SpatialPushPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<SpatialPushProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    direction = "from-left",
    perspective = 1200,
    pushDepth = 1,
    tilt = 0,
  },
}) => {
  // Both scenes are locked to the same travel across the whole window: a push
  // is one move of two panels, not two independent entrances.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });

  const style = useMemo(() => {
    const { axis, sign } = AXIS[direction];
    // A push moves both scenes the same way across the frame: the incoming one
    // arrives from `direction`, the outgoing one is shoved out the far side.
    const travel = sign * (phase.isEntering ? 1 : -1) * phase.displace * pushDepth * 100;
    const rotate = axis === "x" ? "rotateY" : "rotateX";
    const rotateSign = axis === "x" ? 1 : -1;
    const angle = sign * rotateSign * (phase.isEntering ? 1 : -1) * phase.displace * tilt;
    // Overscan only pays for the tilt. Without one the panels are already
    // flush edge to edge, and scaling them would open the seam it closes.
    const scale = tilt === 0 ? 1 : 1 + phase.displace * 0.06;
    const shift = axis === "x" ? `${travel}% 0%` : `0% ${travel}%`;

    return {
      translate: shift,
      transform: `perspective(${perspective}px) ${rotate}(${angle}deg) scale(${scale})`,
      transformOrigin: "center center",
    };
  }, [direction, perspective, phase.displace, phase.isEntering, pushDepth, tilt]);

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
  tilt?: number;
  variant?: TransitionVariant;
};

export function transitionSpatialPush({
  durationInFrames = 24,
  direction = "from-left",
  perspective = 1200,
  pushDepth = 1,
  tilt = 0,
  variant = "editorial",
}: TransitionSpatialPushConfig = {}) {
  return {
    presentation: spatialPush({ direction, perspective, pushDepth, tilt }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionSpatialPushDuration(
  config: TransitionSpatialPushConfig = {},
  fps: number,
): number {
  return transitionSpatialPush(config).timing.getDurationInFrames({ fps });
}
