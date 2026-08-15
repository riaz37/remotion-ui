import type { TransitionPresentation } from "@remotion/transitions";
import { useId } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type WhipPanDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type WhipPanProps = {
  direction?: WhipPanDirection;
  /** Peak blur in px along the travel axis, reached at the fastest point. */
  blur?: number;
  /**
   * Share of the frame each scene travels. Below `1` the two scenes are not
   * edge to edge and the gap between them is bare background.
   */
  travel?: number;
  /**
   * How hard the move is front-loaded into the middle of the window. `1` is the
   * house ease and reads as a push; the default squeezes almost all of the
   * travel into a handful of frames, which is what makes it a whip.
   */
  punch?: number;
};

/**
 * Symmetric ease-in-out that is *exactly* 0 and 1 at the ends.
 *
 * A transition has to be identity at both ends of its window, and "close to
 * identity" is not the same thing: a residual offset of 1e-16 still forces a
 * composite on every frame the scene is on screen. This ratio form is exact by
 * construction — at `d = 0` the numerator is 0, at `d = 1` it equals the
 * denominator — where a `sin`/`cos` shaping is not.
 */
function punchCurve(d: number, punch: number): number {
  if (punch <= 1 || d <= 0) return Math.max(d, 0);
  if (d >= 1) return 1;
  const a = Math.pow(d, punch);
  return a / (a + Math.pow(1 - d, punch));
}

const AXIS: Record<WhipPanDirection, { horizontal: boolean; sign: number }> = {
  "from-left": { horizontal: true, sign: 1 },
  "from-right": { horizontal: true, sign: -1 },
  "from-top": { horizontal: false, sign: 1 },
  "from-bottom": { horizontal: false, sign: -1 },
};

const WhipPanPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<WhipPanProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    direction = "from-left",
    blur = 26,
    travel = 1,
    punch = 2.2,
  },
}) => {
  const { width, height } = useVideoConfig();
  const filterId = useId().replace(/:/g, "");

  // `lead: 1` — both scenes travel locked together for the whole window. A
  // shorter lead desynchronises them and opens a strip of background between.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });

  const { horizontal, sign } = AXIS[direction];

  const shaped = punchCurve(phase.displace, punch);

  /* Parabolic, so it is exactly 0 at both ends of the window. A sine hump has
   * the same shape but `Math.sin(Math.PI)` is 1.2e-16 rather than 0, which
   * would leave a permanent sub-pixel blur filter on a scene at rest — and a
   * filter that is "nearly" identity still costs a full composite every frame.
   * Driven by the shaped travel, so the blur peaks exactly where the frame is
   * moving fastest rather than at the middle of the clock. */
  const speed = 4 * shaped * (1 - shaped);
  const blurPx = Math.max(blur, 0) * speed;

  const offset = sign * shaped * 100 * travel * (phase.isEntering ? 1 : -1);
  const shift = horizontal ? `${offset.toFixed(3)}% 0%` : `0% ${offset.toFixed(3)}%`;

  /* A blurred layer has soft, part-transparent edges, and the seam between the
   * two travelling scenes sits inside the frame for the whole cut — so without
   * this the page background shows through a band right where the eye is. Each
   * layer is grown past its own edges by roughly 3σ, which puts the soft edge
   * over the neighbouring scene instead. Sized against the short axis: a
   * uniform scale driven by `width` under-covers the short side of a 16:9
   * frame and bites a transparent corner mid-cut. */
  const shortSide = Math.min(width, height);
  const overscan = shortSide > 0 ? 1 + (6 * blurPx) / shortSide : 1;

  if (blurPx < 0.25 && phase.displace <= 0) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  if (blurPx < 0.25) {
    return <AbsoluteFill style={{ translate: shift }}>{children}</AbsoluteFill>;
  }

  return (
    <AbsoluteFill style={{ translate: shift }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {/* Directional: `filter: blur()` is isotropic and smears the frame
              across the axis it is *not* travelling on, which reads as
              out-of-focus rather than as speed. */}
          <filter
            id={`${filterId}-whip`}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feGaussianBlur
              stdDeviation={
                horizontal
                  ? `${blurPx.toFixed(2)} 0`
                  : `0 ${blurPx.toFixed(2)}`
              }
            />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill
        style={{
          filter: `url(#${filterId}-whip)`,
          scale: `${overscan.toFixed(5)}`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Whip pan presentation for TransitionSeries */
export function whipPan(
  props: WhipPanProps = {},
): TransitionPresentation<WhipPanProps> {
  return { component: WhipPanPresentation, props };
}

export type TransitionWhipPanConfig = WhipPanProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Whip pan transition config for use with TransitionSeries.Transition */
export function transitionWhipPan({
  durationInFrames = 14,
  variant = "editorial",
  ...presentationProps
}: TransitionWhipPanConfig = {}) {
  return {
    presentation: whipPan(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionWhipPanDuration(
  config: TransitionWhipPanConfig = {},
  fps: number,
): number {
  return transitionWhipPan(config).timing.getDurationInFrames({ fps });
}
