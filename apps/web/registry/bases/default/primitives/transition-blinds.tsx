import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type BlindsOrientation = "horizontal" | "vertical";

export type BlindsProps = {
  /** `horizontal` slats stack top to bottom and sweep sideways. */
  orientation?: BlindsOrientation;
  /** Number of slats. Above ~24 the effect stops reading as slats at 1080p. */
  slats?: number;
  /**
   * Share of the window each slat's start is delayed by, across the whole
   * stack. `0` opens every slat together, which is a plain wipe.
   */
  stagger?: number;
  /** Reverse alternate slats, for a woven counter-sweep. */
  alternate?: boolean;
  /** Soft edge on each slat's leading edge, as a share of the slat's length. */
  edgeSoftness?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Per-slat progress with a cascading start.
 *
 * The window is compressed so the *last* slat still finishes at `coverage === 1`
 * — the naive `coverage - delay` leaves the tail of the stack short of full
 * open at the end of the transition, which shows as permanent stripes over the
 * scene for the rest of its sequence.
 */
function slatProgress(coverage: number, index: number, count: number, stagger: number): number {
  if (count <= 1 || stagger <= 0) {
    return clamp01(coverage);
  }
  const spread = clamp01(stagger);
  const start = (index / (count - 1)) * spread;
  const span = 1 - spread;
  return clamp01((coverage - start) / (span > 0 ? span : 1));
}

const BlindsPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<BlindsProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    orientation = "horizontal",
    slats = 12,
    stagger = 0.45,
    alternate = false,
    edgeSoftness = 0.06,
  },
}) => {
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });
  const coverage = 1 - phase.displace;
  const count = Math.max(1, Math.round(slats));

  const maskStyle = useMemo(() => {
    const horizontal = orientation === "horizontal";
    const feather = Math.max(edgeSoftness, 0) * 100;

    const layers = Array.from({ length: count }, (_, index) => {
      const progress = slatProgress(coverage, index, count, stagger);
      const reversed = alternate && index % 2 === 1;
      /* The edge travels from past one side of the slat to past the other, so
       * a slat at progress 1 is solid all the way across including its
       * feather — a feather measured inside the slat never closes. */
      const edge = progress * (100 + feather * 2) - feather;
      const direction = reversed
        ? horizontal
          ? "to left"
          : "to top"
        : horizontal
          ? "to right"
          : "to bottom";

      return `linear-gradient(${direction}, #000 ${(edge - feather).toFixed(2)}%, transparent ${(edge + feather).toFixed(2)}%)`;
    });

    /* Each slat is cut a few percent taller than its share and the stack is
     * re-spaced to still span the frame exactly. Sized at exactly `100 / count`
     * the layers *should* tile, but each one's edge is antialiased to ~50% and
     * the boundaries land on fractional device pixels, so every seam renders as
     * a hairline of the outgoing scene showing through — twelve bright lines
     * across the frame for the whole cut, at their most obvious in the last
     * frames when everything else is already open. */
    const band = (100 / count) * 1.04;
    const size = horizontal ? `100% ${band.toFixed(4)}%` : `${band.toFixed(4)}% 100%`;

    // A mask layer is positioned as a share of the *free* space left by its own
    // size, so the stack is laid out against `100 - band`, not against 100.
    // Positioning against 100 pushes the last slat off the bottom edge.
    const positions = Array.from({ length: count }, (_, index) => {
      const offset = count === 1 ? 0 : (index / (count - 1)) * 100;
      return horizontal ? `0% ${offset.toFixed(3)}%` : `${offset.toFixed(3)}% 0%`;
    });

    const image = layers.join(", ");
    const sizes = Array.from({ length: count }, () => size).join(", ");
    const places = positions.join(", ");

    return {
      WebkitMaskImage: image,
      maskImage: image,
      WebkitMaskSize: sizes,
      maskSize: sizes,
      WebkitMaskPosition: places,
      maskPosition: places,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
    };
  }, [alternate, count, coverage, edgeSoftness, orientation, stagger]);

  // The outgoing scene holds whole beneath the slats. Cutting it into slats too
  // would open every gap onto the background instead of onto the next scene.
  if (!phase.isEntering) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  if (coverage >= 1) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  return <AbsoluteFill style={maskStyle}>{children}</AbsoluteFill>;
};

/** Slat-sweep presentation for TransitionSeries */
export function blinds(
  props: BlindsProps = {},
): TransitionPresentation<BlindsProps> {
  return { component: BlindsPresentation, props };
}

export type TransitionBlindsConfig = BlindsProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Blinds transition config for use with TransitionSeries.Transition */
export function transitionBlinds({
  durationInFrames = 24,
  variant = "editorial",
  ...presentationProps
}: TransitionBlindsConfig = {}) {
  return {
    presentation: blinds(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionBlindsDuration(
  config: TransitionBlindsConfig = {},
  fps: number,
): number {
  return transitionBlinds(config).timing.getDurationInFrames({ fps });
}
