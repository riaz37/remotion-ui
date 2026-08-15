import type { TransitionPresentation } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type CardFlipAxis = "y" | "x";

export type CardFlipProps = {
  /** `y` flips left-to-right like a page; `x` flips top-over-bottom. */
  axis?: CardFlipAxis;
  /** Perspective distance in px. Lower is a more aggressive, wide-angle flip. */
  perspective?: number;
  /**
   * Colour behind the card while it is edge-on. A flipping frame is zero pixels
   * wide at the halfway point, so *something* is visible there; without this it
   * is the page background, which is the one thing a transition must never
   * expose.
   */
  backdrop?: string;
  /** Peak darkening of the face turning away, 0→1. */
  shading?: number;
  /** How far the card recedes at the halfway point, as a multiple. */
  dip?: number;
};

const CardFlipPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<CardFlipProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    axis = "y",
    perspective = 1600,
    backdrop = "#05060a",
    shading = 0.55,
    dip = 0.86,
  },
}) => {
  // `lead: 1` — the two half-turns have to meet exactly at the midpoint of the
  // window. Any settle at either end desynchronises them and both faces are
  // visible at once, which reads as a double exposure rather than a flip.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });

  // Untouched at rest, which is the whole contract: `displace === 0` has to
  // leave a flat, unrotated, unshaded scene.
  if (phase.displace <= 0) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  /* Each scene turns a full half-circle in its own direction and relies on
   * backface culling for the hand-off: the outgoing face passes 90° at the
   * midpoint and is hidden for the rest of the window, and the incoming one is
   * hidden until it crosses back through -90°. Clamping at 90° instead would
   * leave both faces parked edge-on and flickering against each other. */
  const turn = phase.isEntering ? -180 * phase.displace : 180 * phase.displace;

  // Parabolic: exactly 1 (no recede) at both ends of the window.
  const away = 4 * phase.displace * (1 - phase.displace);
  const scale = 1 - (1 - dip) * away;

  // Light falls off as the face turns away from the viewer. cos() of the turn
  // is the physically-right curve and is exactly 1 at 0°.
  const facing = Math.abs(Math.cos((turn * Math.PI) / 180));
  const shade = interpolate(facing, [0, 1], [shading, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        perspective: `${perspective}px`,
        // Only the outgoing layer paints the backdrop: it sits underneath the
        // incoming one for the whole cut, so one opaque plate covers the seam
        // and the incoming layer stays free to composite over the outgoing
        // scene rather than over a slab of colour.
        backgroundColor: phase.isEntering ? undefined : backdrop,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `rotate${axis === "y" ? "Y" : "X"}(${turn.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
        {shade > 0.001 ? (
          <AbsoluteFill
            style={{
              backgroundColor: "#000",
              opacity: shade,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Whole-frame 3D card flip presentation for TransitionSeries */
export function cardFlip(
  props: CardFlipProps = {},
): TransitionPresentation<CardFlipProps> {
  return { component: CardFlipPresentation, props };
}

export type TransitionCardFlipConfig = CardFlipProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Card flip transition config for use with TransitionSeries.Transition */
export function transitionCardFlip({
  durationInFrames = 24,
  variant = "editorial",
  ...presentationProps
}: TransitionCardFlipConfig = {}) {
  return {
    presentation: cardFlip(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionCardFlipDuration(
  config: TransitionCardFlipConfig = {},
  fps: number,
): number {
  return transitionCardFlip(config).timing.getDurationInFrames({ fps });
}
