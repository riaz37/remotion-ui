import type { TransitionPresentation } from "@remotion/transitions";
import { useId, useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ChromaticAberrationAxis = "horizontal" | "vertical";

export type ChromaticAberrationWipeProps = {
  /** Peak channel separation in px, reached in the middle of the cut. */
  intensity?: number;
  axis?: ChromaticAberrationAxis;
  /** Share of the frame the scenes slide across, 0→1. */
  slide?: number;
};

/**
 * Isolates one channel and drops the other two, so three stacked copies
 * recombine to the original image under `screen` — an actual channel
 * separation rather than a coloured drop-shadow behind the whole layer.
 */
const CHANNEL_MATRIX = {
  red: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  green: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  blue: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
} as const;

const CHANNEL_OFFSET: Record<keyof typeof CHANNEL_MATRIX, number> = {
  red: 1,
  green: 0,
  blue: -1,
};

const ChromaticPresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ChromaticAberrationWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { intensity = 12, axis = "horizontal", slide = 1 },
}) => {
  const filterId = useId().replace(/:/g, "");
  // No fade: the two scenes slide locked together and cover the frame between
  // them, so dropping either one's opacity only lets the background through.
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });

  // The split is a stress artefact of the move: nothing at either end, hardest
  // where the frame is travelling fastest.
  const separation = interpolate(
    phase.displace,
    [0, 0.5, 1],
    [0, intensity, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const travel = phase.displace * (phase.isEntering ? 100 : -100) * slide;

  const shift = useMemo(
    () => (axis === "horizontal" ? `${travel}% 0%` : `0% ${travel}%`),
    [axis, travel],
  );

  const channels = useMemo(
    () =>
      (Object.keys(CHANNEL_MATRIX) as (keyof typeof CHANNEL_MATRIX)[]).map(
        (channel) => {
          const offset = CHANNEL_OFFSET[channel] * separation;

          return {
            channel,
            style: {
              filter: `url(#${filterId}-${channel})`,
              mixBlendMode: "screen" as const,
              translate:
                axis === "horizontal" ? `${offset}px 0px` : `0px ${offset}px`,
            },
          };
        },
      ),
    [axis, filterId, separation],
  );

  // Under ~0.1px the three copies are indistinguishable from the original and
  // only cost three extra composites, so the split layer is dropped entirely.
  if (separation < 0.1) {
    return (
      <AbsoluteFill style={{ opacity: phase.opacity, translate: shift }}>
        {children}
      </AbsoluteFill>
    );
  }

  return (
    // `isolation` keeps the screen blend inside this scene. Without it the
    // channel copies would blend with the other scene of the transition and
    // wash the whole cut out.
    <AbsoluteFill
      style={{
        opacity: phase.opacity,
        translate: shift,
        isolation: "isolate",
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {(Object.keys(CHANNEL_MATRIX) as (keyof typeof CHANNEL_MATRIX)[]).map(
            (channel) => (
              <filter key={channel} id={`${filterId}-${channel}`}>
                <feColorMatrix
                  type="matrix"
                  values={CHANNEL_MATRIX[channel]}
                />
              </filter>
            ),
          )}
        </defs>
      </svg>
      {channels.map(({ channel, style }) => (
        <AbsoluteFill key={channel} style={style}>
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

export function chromaticAberrationWipe(
  props: ChromaticAberrationWipeProps = {},
): TransitionPresentation<ChromaticAberrationWipeProps> {
  return { component: ChromaticPresentation, props };
}

export type TransitionChromaticAberrationWipeConfig = {
  durationInFrames?: number;
  intensity?: number;
  axis?: ChromaticAberrationAxis;
  slide?: number;
  variant?: TransitionVariant;
};

export function transitionChromaticAberrationWipe({
  durationInFrames = 14,
  intensity = 12,
  axis = "horizontal",
  slide = 1,
  variant = "editorial",
}: TransitionChromaticAberrationWipeConfig = {}) {
  return {
    presentation: chromaticAberrationWipe({ intensity, axis, slide }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionChromaticAberrationWipeDuration(
  config: TransitionChromaticAberrationWipeConfig = {},
  fps: number,
): number {
  return transitionChromaticAberrationWipe(config).timing.getDurationInFrames({
    fps,
  });
}
