"use client";

import { HeatmapGrid } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const DAYS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const WEEKS = 20;

/** Deterministic activity, weighted so weekdays read busier than weekends. */
const CELLS = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: WEEKS }, (_, week) => {
    const noise = Math.sin(week * 1.7 + day * 2.3) * 0.5 + 0.5;
    const weekday = day < 5 ? 1 : 0.35;
    const ramp = 0.4 + (week / WEEKS) * 0.6;
    return Math.round(noise * weekday * ramp * 9);
  }),
);

/**
 * Samples land at frames 18, 60 and 108. The diagonal front crosses twenty
 * columns at 3.4 frames each, so it is a fifth of the way across at the first
 * sample and past the middle at the second; the drain at 96 keeps the third
 * moving.
 */
export const HeatmapGridPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={56}>
    <HeatmapGrid
      cells={CELLS}
      rowLabels={DAYS}
      cellSize={30}
      gap={7}
      delayInFrames={4}
      durationInFrames={14}
      columnStaggerInFrames={3.4}
      rowStaggerInFrames={1.6}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
