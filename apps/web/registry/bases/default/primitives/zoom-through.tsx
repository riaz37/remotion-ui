import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ZoomThroughDirection = "in" | "out";

export type ZoomThroughProps = {
  /** Scale the camera travels through. 2.4 pushes past the frame edge. */
  maxScale?: number;
  /**
   * Blur at the fastest point of the move. Read this as a peak that is actually
   * reached: the blur rides a velocity envelope, so it hits `blurPeak` exactly
   * at the midpoint of the overlap and is 0 at both ends. The old linear ramp
   * only reached its number where the scene was already off-stage, which is why
   * 18 used to look reasonable and now reads as an unrecognisable smear.
   */
  blurPeak?: number;
  /** `in` pushes the camera through the frame; `out` pulls back from it. */
  direction?: ZoomThroughDirection;
};

const ZoomThroughPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ZoomThroughProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { maxScale = 2.4, blurPeak = 8, direction = "in" },
}) => {
  const { width, height } = useVideoConfig();

  // `lead: 1` — both scenes travel through the camera together for the whole
  // window, as in `transition-whip-pan`. A shorter lead lands the incoming
  // scene at rest a few frames into the overlap and leaves the outgoing one
  // drifting as a faint ghost over an already-settled card, which is what this
  // presentation used to do: `lead: 0.6` on top of a spring timing that is
  // already 90% closed at its own midpoint compressed the whole camera move
  // into the first four frames of an 18-frame cut.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
    fade: true,
  });

  const style = useMemo(() => {
    // Both scenes travel the same way through the camera: the outgoing one
    // keeps pushing past the lens while the incoming one arrives out of it.
    const reach = phase.isEntering ? maxScale : 1 + (maxScale - 1) * 0.85;
    const zoomed = 1 + (reach - 1) * phase.displace;
    const scale = direction === "in" ? zoomed : 1 / zoomed;

    /* Velocity, not displacement. A blur taken linearly off `displace` is at
     * full strength exactly where the incoming scene is *arriving*, so the cut
     * lands soft; parabolic, it is exactly 0 at both ends of the window and
     * peaks where the camera is moving fastest. Same envelope as the whip pan. */
    const speed = 4 * phase.displace * (1 - phase.displace);
    const blur = Math.max(0, blurPeak) * speed;

    /* A blurred layer has soft, part-transparent edges, so the stage showed
     * through a band all the way round the frame. Grow the
     * layer past its own edges by roughly 3σ, measured against the short axis —
     * a scale driven by `width` under-covers the short side of a 16:9 frame. */
    const shortSide = Math.min(width, height);
    const overscan = shortSide > 0 ? 1 + (6 * blur) / shortSide : 1;

    return {
      opacity: phase.opacity,
      scale: (scale * overscan).toFixed(5),
      filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
    };
  }, [
    blurPeak,
    direction,
    height,
    maxScale,
    phase.displace,
    phase.isEntering,
    phase.opacity,
    width,
  ]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export function zoomThrough(
  props: ZoomThroughProps = {},
): TransitionPresentation<ZoomThroughProps> {
  return { component: ZoomThroughPresentation, props };
}

export type TransitionZoomThroughConfig = {
  durationInFrames?: number;
  maxScale?: number;
  blurPeak?: number;
  direction?: ZoomThroughDirection;
  variant?: TransitionVariant;
};

export function transitionZoomThrough({
  durationInFrames = 20,
  maxScale = 2.4,
  blurPeak = 8,
  direction = "in",
  // `editorial` like every other transition in the set. `springTiming` is at 90%
  // of its travel by the midpoint of its own window, so the camera move landed
  // in the first quarter of the cut and the remaining three quarters held a
  // settled card — the exact failure `transition-timing.ts` documents.
  variant = "editorial",
}: TransitionZoomThroughConfig = {}) {
  return {
    presentation: zoomThrough({ maxScale, blurPeak, direction }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionZoomThroughDuration(
  config: TransitionZoomThroughConfig = {},
  fps: number,
): number {
  return transitionZoomThrough(config).timing.getDurationInFrames({ fps });
}
