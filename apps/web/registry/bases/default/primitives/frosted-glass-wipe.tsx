import type { TransitionPresentation } from "@remotion/transitions";
import { linearTiming, springTiming } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { springSmooth } from "@/remotion/lib/springs";

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
  const progress =
    presentationDirection === "entering"
      ? presentationProgress
      : 1 - presentationProgress;

  const clipStyle = useMemo(() => {
    const hidden = `${(1 - progress) * 100}%`;
    return direction === "from-left"
      ? { clipPath: `inset(0 ${hidden} 0 0)` }
      : { clipPath: `inset(0 0 0 ${hidden})` };
  }, [direction, progress]);

  const panelStyle = useMemo(() => {
    const edge = progress * 100;
    const widthPct = panelWidth * 100;
    const offset = direction === "from-left" ? edge - widthPct * 0.35 : edge - widthPct * 0.65;

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
      pointerEvents: "none" as const,
    };
  }, [blur, direction, frostColor, panelWidth, progress]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={clipStyle}>{children}</AbsoluteFill>
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
  variant?: "linear" | "spring";
};

/** Frosted glass wipe transition config for use with TransitionSeries.Transition */
export function transitionFrostedGlassWipe({
  durationInFrames = 22,
  blur = 20,
  panelWidth = 0.14,
  direction = "from-left",
  frostColor = "rgba(255,255,255,0.12)",
  variant = "linear",
}: TransitionFrostedGlassWipeConfig = {}) {
  return {
    presentation: frostedGlassWipe({ blur, panelWidth, direction, frostColor }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

export function getTransitionFrostedGlassWipeDuration(
  config: TransitionFrostedGlassWipeConfig = {},
  fps: number,
): number {
  return transitionFrostedGlassWipe(config).timing.getDurationInFrames({ fps });
}
