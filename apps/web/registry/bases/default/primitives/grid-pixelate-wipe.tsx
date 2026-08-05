import type { TransitionPresentation } from "@remotion/transitions";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import {
  resolveTransitionTiming,
  transitionPhase,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

export type GridPixelateOrder =
  | "from-left"
  | "from-top"
  | "diagonal"
  | "center";

export type GridPixelateShape = "square" | "dot";

export type GridPixelateWipeProps = {
  cols?: number;
  rows?: number;
  /** Which corner or axis the cells light up from. */
  order?: GridPixelateOrder;
  shape?: GridPixelateShape;
  /** 0 pops every cell together; 1 spreads them across the whole window. */
  stagger?: number;
};

function cellRank(
  order: GridPixelateOrder,
  col: number,
  row: number,
  cols: number,
  rows: number,
): number {
  const u = cols <= 1 ? 0 : col / (cols - 1);
  const v = rows <= 1 ? 0 : row / (rows - 1);

  switch (order) {
    case "from-left":
      return u;
    case "from-top":
      return v;
    case "diagonal":
      return (u + v) / 2;
    case "center":
      return Math.min(1, Math.hypot(u - 0.5, v - 0.5) / 0.7071);
  }
}

function cellOpacity(
  progress: number,
  rank: number,
  stagger: number,
): number {
  const revealAt = rank * stagger;
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
  order: GridPixelateOrder,
  shape: GridPixelateShape,
  stagger: number,
): string {
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const cells: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const opacity = cellOpacity(
        progress,
        cellRank(order, col, row, cols, rows),
        stagger,
      );

      if (opacity < 0.004) {
        continue;
      }

      const alpha = opacity.toFixed(3);

      if (shape === "dot") {
        // The dot grows with its own reveal, so the frame fills in as a field
        // of expanding points rather than a grid of fading squares.
        const r = (Math.min(cellW, cellH) / 2) * opacity;
        cells.push(
          `<circle cx="${(col + 0.5) * cellW}" cy="${(row + 0.5) * cellH}" r="${r.toFixed(3)}" fill="white" fill-opacity="${alpha}"/>`,
        );
        continue;
      }

      cells.push(
        `<rect x="${col * cellW}" y="${row * cellH}" width="${cellW}" height="${cellH}" fill="white" fill-opacity="${alpha}"/>`,
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${cells.join("")}</svg>`;
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
  passedProps: {
    cols = 12,
    rows = 8,
    order = "from-left",
    shape = "square",
    stagger = 0.82,
  },
}) => {
  const phase = transitionPhase(presentationProgress, presentationDirection, {
    lead: 1,
  });
  const filled = 1 - phase.displace;

  const style = useMemo(() => {
    // Only the arriving scene is masked. Masking the outgoing one as well
    // would leave both partly transparent mid-cut and show the background
    // through the gaps between cells.
    if (!phase.isEntering) {
      return undefined;
    }

    // Built once and handed to both mask properties — the previous version
    // called this twice per frame for identical output.
    const mask = buildGridMask(filled, cols, rows, order, shape, stagger);

    return {
      WebkitMaskImage: mask,
      maskImage: mask,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
    };
  }, [cols, filled, order, phase.isEntering, rows, shape, stagger]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Grid cell stagger wipe presentation for TransitionSeries */
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
  order?: GridPixelateOrder;
  shape?: GridPixelateShape;
  stagger?: number;
  variant?: TransitionVariant;
};

/** Grid pixelate wipe transition config for use with TransitionSeries.Transition */
export function transitionGridPixelateWipe({
  durationInFrames = 26,
  cols = 12,
  rows = 8,
  order = "from-left",
  shape = "square",
  stagger = 0.82,
  variant = "editorial",
}: TransitionGridPixelateWipeConfig = {}) {
  return {
    presentation: gridPixelateWipe({ cols, rows, order, shape, stagger }),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionGridPixelateWipeDuration(
  config: TransitionGridPixelateWipeConfig = {},
  fps: number,
): number {
  return transitionGridPixelateWipe(config).timing.getDurationInFrames({ fps });
}
