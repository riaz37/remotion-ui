import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type FrostedGlassDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type FrostedGlassWipeProps = {
  blur?: number;
  /** Panel width as a share of the frame, 0→1. */
  panelWidth?: number;
  direction?: FrostedGlassDirection;
  frostColor?: string;
};

const AXIS: Record<
  FrostedGlassDirection,
  { vertical: boolean; gradient: string; near: "left" | "right" | "top" | "bottom" }
> = {
  "from-left": { vertical: false, gradient: "to right", near: "left" },
  "from-right": { vertical: false, gradient: "to left", near: "right" },
  "from-top": { vertical: true, gradient: "to bottom", near: "top" },
  "from-bottom": { vertical: true, gradient: "to top", near: "bottom" },
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
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });
  const { vertical, gradient, near } = AXIS[direction];
  const swept = 1 - phase.displace;

  const revealStyle = useMemo(() => {
    // The glass panel covers the frame edge it is crossing, so the scene under
    // it can be cut hard: the panel is what hides the seam. Only the arriving
    // scene is clipped — the outgoing one holds whole beneath it.
    if (!phase.isEntering) {
      return undefined;
    }

    const hidden = `${(1 - swept) * 100}%`;

    return {
      clipPath: vertical
        ? direction === "from-top"
          ? `inset(0 0 ${hidden} 0)`
          : `inset(${hidden} 0 0 0)`
        : direction === "from-left"
          ? `inset(0 ${hidden} 0 0)`
          : `inset(0 0 0 ${hidden})`,
    };
  }, [direction, phase.isEntering, swept, vertical]);

  const panelStyle = useMemo(() => {
    const widthPct = panelWidth * 100;
    // Rides the seam, and is parked off-frame at both ends so it never sits
    // over a scene that is not moving.
    const offset = swept * (100 + widthPct) - widthPct;
    const glow = interpolate(swept, [0, 0.15, 0.85, 1], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const edge = `1px solid rgba(255,255,255,${(0.22 * glow).toFixed(3)})`;

    return {
      position: "absolute" as const,
      ...(vertical
        ? {
            left: 0,
            right: 0,
            top: `${offset}%`,
            height: `${widthPct}%`,
            [near === "top" ? "borderBottom" : "borderTop"]: edge,
          }
        : {
            top: 0,
            bottom: 0,
            left: `${offset}%`,
            width: `${widthPct}%`,
            [near === "left" ? "borderRight" : "borderLeft"]: edge,
          }),
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      background: `linear-gradient(${gradient}, transparent, ${frostColor}, transparent)`,
      boxShadow: `0 0 ${(28 * glow).toFixed(1)}px rgba(255,255,255,${(0.18 * glow).toFixed(3)})`,
      opacity: glow,
      pointerEvents: "none" as const,
    };
  }, [blur, frostColor, gradient, near, panelWidth, swept, vertical]);

  // The exiting scene renders underneath without a panel of its own — one pane
  // of glass crosses the frame, not two.
  if (!phase.isEntering) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={revealStyle}>{children}</AbsoluteFill>
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
