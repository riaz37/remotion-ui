import { linearTiming, springTiming } from "@remotion/transitions";
import type { TransitionPresentationComponentProps } from "@remotion/transitions";
import { Easing, interpolate } from "remotion";
import { springSmooth } from "./springs";

export type TransitionVariant = "linear" | "spring" | "editorial";

/** Balanced ease-in-out — matches `EASING.editorial` from `motion-tokens`. */
const EASING_CUT = Easing.bezier(0.45, 0, 0.55, 1);

export function resolveTransitionTiming({
  durationInFrames,
  variant = "editorial",
}: {
  durationInFrames: number;
  variant?: TransitionVariant;
}) {
  if (variant === "spring") {
    return springTiming({ config: springSmooth, durationInFrames });
  }

  return linearTiming({
    durationInFrames,
    // A cut is not an entrance. `EASING_ENTER` is tuned for an element landing
    // on a stage that is already there and reaches ~0.9 by 40% of its window —
    // used as a transition curve it spends three quarters of the overlap with
    // both scenes already settled, which is why every presentation looked like
    // a hard cut. An ease-in-out carries the frame across the whole window.
    easing: variant === "editorial" ? EASING_CUT : undefined,
  });
}

export type TransitionDirection =
  TransitionPresentationComponentProps<
    Record<string, unknown>
  >["presentationDirection"];

export type TransitionPhase = {
  isEntering: boolean;
  /**
   * How far the scene sits from its resting position, 0→1.
   *
   * `0` **always** means "untouched": the scene is whole, centred and sharp.
   * `1` means fully displaced — off-stage for an entering scene that has not
   * arrived yet, and off-stage again for an exiting scene that has left.
   *
   * A presentation therefore only ever scales its effect by `displace`, and
   * never has to know which direction it is playing. This matters because
   * `TransitionSeries` keeps a presentation mounted for the sequence's whole
   * life and holds `presentationProgress` at 0 outside the overlap — so any
   * effect that is non-zero at `displace === 0` is applied to the scene for
   * every frame it is on screen, not just during the transition.
   */
  displace: number;
  /** 1 = opaque. Only meaningful when the presentation opted into fading. */
  opacity: number;
  /** Untouched 0→1 progress of the transition itself, both directions. */
  progress: number;
};

export type TransitionPhaseOptions = {
  /**
   * Fraction of the window the displacement takes, so motion can settle before
   * the transition ends (entering) or hold before it starts (exiting).
   */
  lead?: number;
  /**
   * Crossfade alongside the displacement. Leave `false` for wipes and any
   * presentation that covers the frame — fading both scenes at once lets the
   * background show through the middle of the cut.
   */
  fade?: boolean;
};

/**
 * Normalises a presentation's progress into a direction-agnostic phase.
 *
 * ```tsx
 * const { displace, opacity } = transitionPhase(
 *   presentationProgress,
 *   presentationDirection,
 *   { fade: true },
 * );
 * const blur = displace * maxBlur; // 0 when the scene is at rest
 * ```
 */
export function transitionPhase(
  presentationProgress: number,
  presentationDirection: TransitionDirection,
  { lead = 0.72, fade = false }: TransitionPhaseOptions = {},
): TransitionPhase {
  const isEntering = presentationDirection === "entering";

  // No easing here on purpose. `presentationProgress` has already been shaped
  // by the transition's `timing`; easing it a second time compresses the whole
  // move into the first few frames of the overlap and every presentation
  // degenerates into a hard cut. This only re-windows the progress.
  // `lead >= 1` means the scene moves across the whole window with no settle.
  // Presentations where both scenes travel together (a push) need this — a
  // lead below 1 desynchronises them and opens a gap onto the background.
  const spansWindow = lead >= 1;

  if (isEntering) {
    const arrived = spansWindow
      ? presentationProgress
      : interpolate(presentationProgress, [0, lead, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

    return {
      isEntering,
      displace: 1 - arrived,
      opacity: fade
        ? interpolate(presentationProgress, [0, 0.42, 1], [0, 0.72, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1,
      progress: presentationProgress,
    };
  }

  const left = spansWindow
    ? presentationProgress
    : interpolate(presentationProgress, [0, 1 - lead, 1], [0, 0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return {
    isEntering,
    displace: left,
    opacity: fade
      ? interpolate(presentationProgress, [0, 0.58, 1], [1, 0.42, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1,
    progress: presentationProgress,
  };
}
