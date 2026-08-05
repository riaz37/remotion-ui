import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type DirectionalWipeDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type DirectionalWipeProps = {
  direction?: DirectionalWipeDirection;
  /** Width of the soft edge as a share of the frame, 0→1. 0 cuts hard. */
  edgeSoftness?: number;
  /** Parallax the scenes carry under the wipe, as a share of the frame. */
  depth?: number;
};

const GRADIENT_AXIS: Record<DirectionalWipeDirection, string> = {
  "from-left": "to right",
  "from-right": "to left",
  "from-top": "to bottom",
  "from-bottom": "to top",
};

const PARALLAX_AXIS: Record<
  DirectionalWipeDirection,
  { axis: "x" | "y"; sign: number }
> = {
  "from-left": { axis: "x", sign: -1 },
  "from-right": { axis: "x", sign: 1 },
  "from-top": { axis: "y", sign: -1 },
  "from-bottom": { axis: "y", sign: 1 },
};

/**
 * Soft-edged reveal mask. The edge travels from just past the far side of the
 * frame to just past the near side, so at `displace === 0` the scene is whole
 * and at `displace === 1` none of it is left — the feather never clips short.
 */
function wipeMask(
  direction: DirectionalWipeDirection,
  displace: number,
  softness: number,
): string {
  const feather = Math.max(softness, 0) * 50;
  const edge = (1 - displace) * (100 + feather * 2) - feather;

  return `linear-gradient(${GRADIENT_AXIS[direction]}, #000 ${edge - feather}%, transparent ${edge + feather}%)`;
}

const DirectionalWipePresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<DirectionalWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = "from-left", edgeSoftness = 0.12, depth = 0.08 },
}) => {
  const phase = transitionPhase(presentationProgress, presentationDirection);

  const style = useMemo(() => {
    const { axis, sign } = PARALLAX_AXIS[direction];
    const travel = sign * phase.displace * depth * 100;
    const shift =
      axis === "x"
        ? `${phase.isEntering ? travel : -travel}% 0%`
        : `0% ${phase.isEntering ? travel : -travel}%`;

    // The outgoing scene is covered by the incoming one rather than wiped
    // itself. Masking both would open a hole onto the background mid-cut.
    if (!phase.isEntering) {
      return { translate: shift };
    }

    const mask = wipeMask(direction, phase.displace, edgeSoftness);

    return {
      translate: shift,
      WebkitMaskImage: mask,
      maskImage: mask,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
    };
  }, [depth, direction, edgeSoftness, phase.displace, phase.isEntering]);

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
  edgeSoftness = 0.12,
  depth = 0.08,
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
