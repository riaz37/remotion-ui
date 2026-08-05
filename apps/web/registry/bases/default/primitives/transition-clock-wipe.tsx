import type { TransitionPresentation } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { useVideoConfig } from "remotion";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type ClockWipeProps = {
  /** Defaults to the composition width. */
  width?: number;
  /** Defaults to the composition height. */
  height?: number;
};

/**
 * `clockWipe()` needs the frame size to build its sweep, which forced every
 * caller to reach for `useVideoConfig()` first and pass it down — including in
 * the config helpers, where hooks are not available. Resolving it inside the
 * presentation instead makes the size optional everywhere.
 */
const AutoSizedClockWipe: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<ClockWipeProps>["component"]>
  >
> = ({ passedProps, ...rest }) => {
  const config = useVideoConfig();
  const presentation = clockWipe({
    width: passedProps.width ?? config.width,
    height: passedProps.height ?? config.height,
  });
  const Presentation = presentation.component;

  return <Presentation {...rest} passedProps={presentation.props} />;
};

export function autoClockWipe(
  props: ClockWipeProps = {},
): TransitionPresentation<ClockWipeProps> {
  return { component: AutoSizedClockWipe, props };
}

export type TransitionClockWipeConfig = {
  durationInFrames?: number;
  width?: number;
  height?: number;
  variant?: TransitionVariant;
};

/** Clock wipe transition config for use with TransitionSeries.Transition */
export function transitionClockWipe({
  durationInFrames = 26,
  width,
  height,
  variant = "editorial",
}: TransitionClockWipeConfig = {}) {
  return {
    presentation: autoClockWipe({ width, height }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionClockWipeDuration(
  config: TransitionClockWipeConfig = {},
  fps: number,
): number {
  return transitionClockWipe(config).timing.getDurationInFrames({ fps });
}
