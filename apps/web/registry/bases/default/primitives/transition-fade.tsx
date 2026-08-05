import type { TransitionPresentation } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type FadeProps = {
  /** Colour the cut passes through. Undefined crossfades the scenes directly. */
  dipTo?: string;
};

/**
 * Dip to colour: the outgoing scene sinks into `dipTo`, the frame holds that
 * colour for an instant, and the incoming scene rises back out of it. Each
 * scene paints its own colour layer, so the dip is opaque at the midpoint
 * whatever is behind the transition.
 */
const FadePresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<FadeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { dipTo },
}) => {
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
    fade: true,
  });

  if (dipTo === undefined) {
    return <AbsoluteFill style={{ opacity: phase.opacity }}>{children}</AbsoluteFill>;
  }
  // Reaches full colour by the halfway point rather than at the very end, so
  // the two half-covered scenes meet as one opaque field instead of a muddy
  // 75% blend of both.
  const veil = interpolate(phase.displace, [0, 0.5, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ background: dipTo, opacity: veil }} />
    </AbsoluteFill>
  );
};

export function crossfade(
  props: FadeProps = {},
): TransitionPresentation<FadeProps> {
  return { component: FadePresentation, props };
}

export type TransitionFadeConfig = {
  durationInFrames?: number;
  /** `spring` uses organic motion; `editorial` ease-out; `linear` is constant speed */
  variant?: TransitionVariant;
  /**
   * Pass a colour to dip through it instead of crossfading the two scenes
   * directly — the classic dip to black between beats.
   */
  dipTo?: string;
};

/** Fade transition config for use with TransitionSeries.Transition */
export function transitionFade({
  durationInFrames = 18,
  variant = "editorial",
  dipTo,
}: TransitionFadeConfig = {}) {
  return {
    presentation: crossfade({ dipTo }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

/** Total overlap frames consumed by a transition (for composition duration math) */
export function getTransitionFadeDuration(
  config: TransitionFadeConfig = {},
  fps: number,
): number {
  return transitionFade(config).timing.getDurationInFrames({ fps });
}
