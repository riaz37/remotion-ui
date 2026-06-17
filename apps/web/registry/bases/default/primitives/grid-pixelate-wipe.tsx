import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type GridPixelateDirection = "from-left" | "from-top";

export type GridPixelateWipeProps = {
  cols?: number;
  rows?: number;
  direction?: GridPixelateDirection;
  stagger?: number;
};

function cellOpacity(
  progress: number,
  order: number,
  total: number,
  stagger: number,
): number {
  if (total <= 1) {
    return progress;
  }

  const normalized = order / (total - 1);
  const revealAt = normalized * stagger;
  const span = Math.max(1 - stagger, 0.001);
  const raw = Math.min(1, Math.max(0, (progress - revealAt) / span));

  return interpolate(raw, [0, 1], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function buildGridMask(
  progress: number,
  cols: number,
  rows: number,
  direction: GridPixelateDirection,
  stagger: number,
): string {
  const easedProgress = interpolate(progress, [0, 1], [0, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const total = cols * rows;
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const rects: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const order =
        direction === "from-left" ? row * cols + col : col * rows + row;
      const opacity = cellOpacity(easedProgress, order, total, stagger);
      rects.push(
        `<rect x="${col * cellW}%" y="${row * cellH}%" width="${cellW}%" height="${cellH}%" fill="white" fill-opacity="${opacity.toFixed(3)}"/>`,
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const GridPixelateWipePresentation: React.FC<
  React.ComponentProps<
    NonNullable<TransitionPresentation<GridPixelateWipeProps>["component"]>
  >
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { cols = 12, rows = 8, direction = "from-left", stagger = 0.82 },
}) => {
  const progress =
    presentationDirection === "entering"
      ? presentationProgress
      : 1 - presentationProgress;

  const style = useMemo(
    () => ({
      WebkitMaskImage: buildGridMask(progress, cols, rows, direction, stagger),
      maskImage: buildGridMask(progress, cols, rows, direction, stagger),
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      opacity: interpolate(progress, [0, 0.15, 1], [0.35, 0.85, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    }),
    [cols, direction, progress, rows, stagger],
  );

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Grid cell opacity stagger wipe presentation for TransitionSeries */
export function gridPixelateWipe(
  props: GridPixelateWipeProps = {},
): TransitionPresentation<GridPixelateWipeProps> {
  return {
    component: GridPixelateWipePresentation,
    props,
  };
}

export type TransitionGridPixelateWipeConfig = {
  durationInFrames?: number;
  cols?: number;
  rows?: number;
  direction?: GridPixelateDirection;
  stagger?: number;
  variant?: TransitionVariant;
};

/** Grid pixelate wipe transition config for use with TransitionSeries.Transition */
export function transitionGridPixelateWipe({
  durationInFrames = 26,
  cols = 12,
  rows = 8,
  direction = "from-left",
  stagger = 0.82,
  variant = "editorial",
}: TransitionGridPixelateWipeConfig = {}) {
  return {
    presentation: gridPixelateWipe({ cols, rows, direction, stagger }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionGridPixelateWipeDuration(
  config: TransitionGridPixelateWipeConfig = {},
  fps: number,
): number {
  return transitionGridPixelateWipe(config).timing.getDurationInFrames({ fps });
}
