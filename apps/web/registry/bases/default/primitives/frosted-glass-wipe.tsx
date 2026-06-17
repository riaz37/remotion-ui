import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  layeredEnterProgress,
  layeredExitProgress,
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type FrostedGlassDirection = "from-left" | "from-right";

export type FrostedGlassWipeProps = {
  blur?: number;
  panelWidth?: number;
  direction?: FrostedGlassDirection;
  frostColor?: string;
};

const FrostedGlassWipePresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<FrostedGlassWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: {
    blur = 20,
    panelWidth = 0.14,
    direction = "from-left",
    frostColor = "rgba(255,255,255,0.12)",
  },
}) => {
  const isEntering = presentationDirection === "entering";
  const layered = isEntering
    ? layeredEnterProgress(presentationProgress, 0.7)
    : layeredExitProgress(presentationProgress, 0.66);
  const progress = isEntering ? layered.motion : 1 - layered.motion;
  const opacity = layered.opacity;

  const clipStyle = useMemo(() => {
    const hidden = `${(1 - progress) * 100}%`;
    return direction === "from-left"
      ? { clipPath: `inset(0 ${hidden} 0 0)` }
      : { clipPath: `inset(0 0 0 ${hidden})` };
  }, [direction, progress]);

  const panelStyle = useMemo(() => {
    const edge = progress * 100;
    const widthPct = panelWidth * 100;
    const offset =
      direction === "from-left"
        ? edge - widthPct * 0.35
        : edge - widthPct * 0.65;
    const glow = interpolate(progress, [0, 0.35, 0.85, 1], [0, 1, 0.6, 0]);

    return {
      position: "absolute" as const,
      top: 0,
      bottom: 0,
      left: `${offset}%`,
      width: `${widthPct}%`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      background: frostColor,
      borderLeft:
        direction === "from-left"
          ? "1px solid rgba(255,255,255,0.22)"
          : undefined,
      borderRight:
        direction === "from-right"
          ? "1px solid rgba(255,255,255,0.22)"
          : undefined,
      boxShadow: `0 0 ${28 * glow}px rgba(255,255,255,${0.18 * glow})`,
      pointerEvents: "none" as const,
    };
  }, [blur, direction, frostColor, panelWidth, progress]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ ...clipStyle, opacity }}>{children}</AbsoluteFill>
      <div style={panelStyle} />
    </AbsoluteFill>
  );
};

/** Progressive frosted glass panel sweep presentation for TransitionSeries */
export function frostedGlassWipe(
  props: FrostedGlassWipeProps = {},
): TransitionPresentation<FrostedGlassWipeProps> {
  return {
    component: FrostedGlassWipePresentation,
    props,
  };
}

export type TransitionFrostedGlassWipeConfig = {
  durationInFrames?: number;
  blur?: number;
  panelWidth?: number;
  direction?: FrostedGlassDirection;
  frostColor?: string;
  variant?: TransitionVariant;
};

/** Frosted glass wipe transition config for use with TransitionSeries.Transition */
export function transitionFrostedGlassWipe({
  durationInFrames = 24,
  blur = 20,
  panelWidth = 0.14,
  direction = "from-left",
  frostColor = "rgba(255,255,255,0.12)",
  variant = "editorial",
}: TransitionFrostedGlassWipeConfig = {}) {
  return {
    presentation: frostedGlassWipe({ blur, panelWidth, direction, frostColor }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionFrostedGlassWipeDuration(
  config: TransitionFrostedGlassWipeConfig = {},
  fps: number,
): number {
  return transitionFrostedGlassWipe(config).timing.getDurationInFrames({ fps });
}
