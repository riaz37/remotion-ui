import type { TransitionPresentation } from "@remotion/transitions";
import { linearTiming, springTiming } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { springSmooth } from "@/remotion/lib/springs";

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

  return Math.min(1, Math.max(0, (progress - revealAt) / span));
}

function buildGridMask(
  progress: number,
  cols: number,
  rows: number,
  direction: GridPixelateDirection,
  stagger: number,
): string {
  const total = cols * rows;
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const rects: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const order =
        direction === "from-left" ? row * cols + col : col * rows + row;
      const opacity = cellOpacity(progress, order, total, stagger);
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
  variant?: "linear" | "spring";
};

/** Grid pixelate wipe transition config for use with TransitionSeries.Transition */
export function transitionGridPixelateWipe({
  durationInFrames = 24,
  cols = 12,
  rows = 8,
  direction = "from-left",
  stagger = 0.82,
  variant = "linear",
}: TransitionGridPixelateWipeConfig = {}) {
  return {
    presentation: gridPixelateWipe({ cols, rows, direction, stagger }),
    timing:
      variant === "spring"
        ? springTiming({ config: springSmooth, durationInFrames })
        : linearTiming({ durationInFrames }),
  };
}

export function getTransitionGridPixelateWipeDuration(
  config: TransitionGridPixelateWipeConfig = {},
  fps: number,
): number {
  return transitionGridPixelateWipe(config).timing.getDurationInFrames({ fps });
}
