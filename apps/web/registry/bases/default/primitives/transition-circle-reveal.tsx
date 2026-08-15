import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type CircleRevealProps = {
  /** Centre of the circle, 0→1 of the frame. */
  originX?: number;
  originY?: number;
  /**
   * Feathered edge width as a share of the final radius. `0` cuts a hard
   * circle; the default is just enough to kill the aliasing staircase a hard
   * mask leaves on a large circle.
   */
  edgeSoftness?: number;
  /**
   * Scale the outgoing scene drifts to under the hole, as a multiple. `1`
   * holds it still. A little push-back sells the circle as depth rather than
   * as a sticker.
   */
  underScale?: number;
};

/**
 * The radius that guarantees full coverage from an off-centre origin.
 *
 * A circle grown from a corner has to reach the opposite corner, so sizing it
 * against half the diagonal leaves an un-revealed wedge for any origin that is
 * not dead centre.
 */
function coveringRadius(
  width: number,
  height: number,
  originX: number,
  originY: number,
): number {
  const dx = Math.max(originX, 1 - originX) * width;
  const dy = Math.max(originY, 1 - originY) * height;
  return Math.hypot(dx, dy);
}

const CircleRevealPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<CircleRevealProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    originX = 0.5,
    originY = 0.5,
    edgeSoftness = 0.04,
    underScale = 1,
  },
}) => {
  const { width, height } = useVideoConfig();
  // `lead: 1` — the hole grows across the whole overlap. A shorter lead parks
  // a fully-open circle for the tail of the window, which reads as a hard cut
  // followed by dead frames.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });

  const coverage = 1 - phase.displace;

  const enteringStyle = useMemo(() => {
    const full = coveringRadius(width, height, originX, originY);
    const feather = Math.max(edgeSoftness, 0) * full;
    // The mask is grown past `full` by the feather width so the soft edge has
    // left the frame by the time the transition ends — otherwise the last few
    // frames keep a translucent ring over the corner furthest from the origin.
    const outer = coverage * (full + feather);
    const inner = Math.max(outer - feather, 0);
    const mask = `radial-gradient(circle at ${originX * 100}% ${originY * 100}%, #000 ${inner.toFixed(1)}px, transparent ${outer.toFixed(1)}px)`;

    return {
      WebkitMaskImage: mask,
      maskImage: mask,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
    };
  }, [coverage, edgeSoftness, height, originX, originY, width]);

  // The outgoing scene is never masked. Punching the hole in both layers would
  // open it onto the page background rather than onto the next scene.
  if (!phase.isEntering) {
    const scale = 1 + (underScale - 1) * phase.displace;
    return (
      <AbsoluteFill style={scale === 1 ? undefined : { scale: `${scale}` }}>
        {children}
      </AbsoluteFill>
    );
  }

  // Fully open: hand the scene back untouched rather than leaving a mask that
  // costs a composite on every remaining frame of the sequence.
  if (coverage >= 1) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  return <AbsoluteFill style={enteringStyle}>{children}</AbsoluteFill>;
};

/** Circular reveal presentation for TransitionSeries */
export function circleReveal(
  props: CircleRevealProps = {},
): TransitionPresentation<CircleRevealProps> {
  return { component: CircleRevealPresentation, props };
}

export type TransitionCircleRevealConfig = CircleRevealProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Circle reveal transition config for use with TransitionSeries.Transition */
export function transitionCircleReveal({
  durationInFrames = 22,
  variant = "editorial",
  ...presentationProps
}: TransitionCircleRevealConfig = {}) {
  return {
    presentation: circleReveal(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionCircleRevealDuration(
  config: TransitionCircleRevealConfig = {},
  fps: number,
): number {
  return transitionCircleReveal(config).timing.getDurationInFrames({ fps });
}
