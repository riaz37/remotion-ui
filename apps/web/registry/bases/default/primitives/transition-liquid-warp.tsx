import type { TransitionPresentation } from "@remotion/transitions";
import {
  displacementPresentation,
  type DisplacementPresentationProps,
} from "@/remotion/lib/displacement-presentation";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

/**
 * Liquid displacement warp.
 *
 * The turbulence channel of the shared displacement presentation, tuned rather
 * than reimplemented: a low base frequency gives large, slow lobes that read as
 * liquid, where the core's default frequency reads as sand at 30 fps. The
 * mask channel is left off entirely — this cut reveals by dissolving, not by a
 * travelling shape.
 */

export type LiquidWarpProps = {
  /** Peak displacement in px at the middle of the cut. */
  scale?: number;
  /**
   * Turbulence base frequency. Below ~0.004 the field is so large it reads as
   * a lens rather than a liquid; above ~0.02 it reads as noise.
   */
  frequency?: number;
  /** Turbulence octaves. Above 3 costs a lot and adds almost nothing here. */
  octaves?: number;
  /** How much the noise field re-seeds across the cut. 0 holds one static lens. */
  churn?: number;
  /** Peak blur in px, on the same curve as the displacement. */
  blur?: number;
  seed?: number;
  /** Warp both scenes, or only the arriving one. */
  affect?: "both" | "entering";
};

export const LIQUID_WARP_DEFAULTS = {
  scale: 140,
  frequency: 0.006,
  octaves: 2,
  churn: 6,
  blur: 3,
  seed: 7,
  affect: "both",
} as const satisfies Required<LiquidWarpProps>;

function liquidProps(props: LiquidWarpProps): DisplacementPresentationProps {
  // Defaulted field by field rather than spread: an explicitly `undefined`
  // property would overwrite the core's own default with `undefined`, and
  // `undefined * n` is NaN — which SVG silently drops, so the filter would just
  // stop working with no error anywhere.
  return {
    scale: props.scale ?? LIQUID_WARP_DEFAULTS.scale,
    frequency: props.frequency ?? LIQUID_WARP_DEFAULTS.frequency,
    octaves: props.octaves ?? LIQUID_WARP_DEFAULTS.octaves,
    churn: props.churn ?? LIQUID_WARP_DEFAULTS.churn,
    blur: props.blur ?? LIQUID_WARP_DEFAULTS.blur,
    seed: props.seed ?? LIQUID_WARP_DEFAULTS.seed,
    affect: props.affect ?? LIQUID_WARP_DEFAULTS.affect,
    turbulenceType: "fractalNoise",
    profile: "peak",
    // A warp on its own never reveals anything — the frame is still the old
    // scene, just stirred. Only the arriving scene fades; the core handles
    // that, and fading both would let the background through the middle.
    fade: true,
    lead: 1,
  };
}

/** Liquid warp presentation for TransitionSeries */
export function liquidWarp(
  props: LiquidWarpProps = {},
): TransitionPresentation<DisplacementPresentationProps> {
  return displacementPresentation(liquidProps(props));
}

export type TransitionLiquidWarpConfig = LiquidWarpProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Liquid warp transition config for use with TransitionSeries.Transition */
export function transitionLiquidWarp({
  durationInFrames = 26,
  variant = "editorial",
  ...presentationProps
}: TransitionLiquidWarpConfig = {}) {
  return {
    presentation: liquidWarp(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionLiquidWarpDuration(
  config: TransitionLiquidWarpConfig = {},
  fps: number,
): number {
  return transitionLiquidWarp(config).timing.getDurationInFrames({ fps });
}
