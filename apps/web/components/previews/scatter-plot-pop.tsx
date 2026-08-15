"use client";

import { ScatterPlotPop } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Deterministic cloud with a real positive correlation and honest spread. */
const POINTS = Array.from({ length: 26 }, (_, index) => {
  const x = 4 + index * 1.7 + Math.sin(index * 2.4) * 1.4;
  const y = 18 + x * 1.6 + Math.sin(index * 1.13) * 14;
  return { x, y, weight: 0.5 + (Math.sin(index * 0.7) * 0.5 + 0.5) };
});

/**
 * Samples land at frames 18, 60 and 108. Twenty-six dots on a 3-frame stagger
 * fill from frame 6 to 97, so the cloud is a third full at the first sample and
 * nearly complete at the second; the trend line lands after the last dot and
 * the drain at 96 covers the third.
 */
export const ScatterPlotPopPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <ScatterPlotPop
      points={POINTS}
      width={800}
      height={380}
      xLabel="Scenes per project"
      delayInFrames={6}
      durationInFrames={18}
      staggerInFrames={3}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
