import type { TransitionPresentation } from "@remotion/transitions";
import { useId, useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  DISPLACEMENT_DEFAULTS,
  DISPLACEMENT_EPSILON,
  displacementFrame,
  maskFrame,
  MASK_DEFAULTS,
  prepareMaskMorph,
  type DisplacementCoreConfig,
  type DisplacementMaskConfig,
} from "./displacement-transition";
import { morphPath } from "./path-morph";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "./transition-timing";

/**
 * The shared displacement presentation.
 *
 * `transition-liquid-warp` and `transition-morph-shape` are configurations of
 * this, not separate implementations: one is the turbulence channel with no
 * mask, the other is the mask channel with no turbulence. Building them apart
 * would have meant two copies of the displace-contract handling, which is the
 * part that is easy to get subtly wrong and impossible to notice in a preview.
 *
 * It satisfies the same contract as every shipped transition:
 * `transitionPhase().displace === 0` leaves the scene completely untouched, and
 * both effect channels are pinned to zero there.
 */

export type DisplacementPresentationProps = DisplacementCoreConfig & {
  /**
   * Reveal the entering scene through a morphing shape. Omit for a pure warp.
   * When present the exiting scene holds whole underneath, as with any wipe —
   * fading both scenes at once lets the background show through the cut.
   */
  mask?: DisplacementMaskConfig;
  /** Crossfade alongside the warp. On by default: a warp alone never reveals. */
  fade?: boolean;
  /** Share of the window the displacement spans. */
  lead?: number;
  /** Warp both scenes, or only the arriving one. */
  affect?: "both" | "entering";
};

const DisplacementPresentationComponent: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<DisplacementPresentationProps>["component"]>
  >
> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const { width, height } = useVideoConfig();
  const rawId = useId();
  // `useId()` returns colons, which are not legal in a CSS `url(#...)` fragment.
  const domId = rawId.replace(/:/g, "");

  const mask = passedProps.mask;
  const hasMask = mask !== undefined;
  const fade = passedProps.fade ?? !hasMask;
  const lead = passedProps.lead ?? 1;
  const affect = passedProps.affect ?? (hasMask ? "entering" : "both");

  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead,
    fade,
  });

  /**
   * Only the arriving scene fades.
   *
   * `transitionPhase({ fade: true })` ramps both scenes' opacity, which is
   * right for a dip-to-colour and wrong here: a warp does not cover the frame,
   * so two half-transparent scenes let the page background through and the
   * middle of the cut renders as a white flash. The outgoing scene holds fully
   * opaque underneath and the incoming one dissolves onto it instead.
   */
  const opacity = fade && phase.isEntering ? phase.opacity : 1;

  // The overscan is uniform, so it has to be sized against the short axis.
  const state = displacementFrame(phase.displace, Math.min(width, height), passedProps);
  const maskState = maskFrame(phase.displace, { width, height }, mask ?? {});

  const maskPair = useMemo(
    () => (hasMask ? prepareMaskMorph(mask) : null),
    // Depending on the config object itself would rebuild the pair every frame,
    // and preparing a morph is the expensive half.
    [hasMask, mask?.from, mask?.to],
  );

  const wantsFilter =
    state.scale >= DISPLACEMENT_EPSILON &&
    (affect === "both" || phase.isEntering);
  const wantsMask = hasMask && phase.isEntering && !maskState.isComplete;

  const frequency = passedProps.frequency ?? DISPLACEMENT_DEFAULTS.frequency;
  const octaves = passedProps.octaves ?? DISPLACEMENT_DEFAULTS.octaves;
  const turbulenceType =
    passedProps.turbulenceType ?? DISPLACEMENT_DEFAULTS.turbulenceType;

  // The exiting scene under a mask is a plain hold — one shape crosses the
  // frame, not two.
  if (hasMask && !phase.isEntering) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  if (!wantsFilter && !wantsMask) {
    return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
  }

  const maskD =
    maskPair && wantsMask ? morphPath(maskState.coverage, maskPair) : null;

  return (
    <AbsoluteFill
      style={{
        opacity,
        ...(wantsMask ? { clipPath: `url(#${domId}-clip)` } : {}),
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {wantsFilter ? (
            <filter id={`${domId}-warp`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type={turbulenceType}
                baseFrequency={frequency}
                numOctaves={octaves}
                seed={state.seed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={state.scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
              {state.blur > 0.1 ? (
                <feGaussianBlur stdDeviation={state.blur} />
              ) : null}
            </filter>
          ) : null}
          {maskD ? (
            <clipPath id={`${domId}-clip`} clipPathUnits="userSpaceOnUse">
              {/* The path is authored in a unit box, so the frame-sized
                  geometry is a transform rather than a per-frame rescale of
                  the path data itself. */}
              <path
                d={maskD}
                transform={`translate(${maskState.centerX} ${maskState.centerY}) scale(${maskState.size}) translate(-0.5 -0.5)`}
              />
            </clipPath>
          ) : null}
        </defs>
      </svg>
      <AbsoluteFill
        style={
          wantsFilter
            ? {
                filter: `url(#${domId}-warp)`,
                // Displacing by N pixels drags N pixels of nothing in from
                // outside the layer; scaling up by the same amount keeps the
                // transparent border off screen.
                scale: `${state.overscan}`,
              }
            : undefined
        }
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Displacement presentation for `TransitionSeries.Transition`. */
export function displacementPresentation(
  props: DisplacementPresentationProps = {},
): TransitionPresentation<DisplacementPresentationProps> {
  return { component: DisplacementPresentationComponent, props };
}

export type TransitionDisplacementConfig = DisplacementPresentationProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

export function transitionDisplacement({
  durationInFrames = 20,
  variant = "editorial",
  ...presentationProps
}: TransitionDisplacementConfig = {}) {
  return {
    presentation: displacementPresentation(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionDisplacementDuration(
  config: TransitionDisplacementConfig = {},
  fps: number,
): number {
  return transitionDisplacement(config).timing.getDurationInFrames({ fps });
}

export { MASK_DEFAULTS };
