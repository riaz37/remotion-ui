"use client";

import { BarChartRace } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Two deliberate overtakes: Motion passes Studio, Render passes Editor. */
const SERIES = [
  { label: "Studio", values: [42, 58, 66, 72, 78, 84] },
  { label: "Motion", values: [18, 34, 57, 76, 92, 108] },
  { label: "Editor", values: [30, 40, 47, 52, 57, 61] },
  { label: "Render", values: [12, 22, 36, 50, 63, 79] },
  { label: "Capture", values: [24, 28, 31, 35, 38, 42] },
  { label: "Stage", values: [8, 12, 17, 21, 26, 30] },
];

const STEPS = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];

/**
 * Samples land at frames 18, 60 and 108. Six keyframes at 18 frames each run
 * the race from frame 4 to 94 — the first sample sits mid-Q2, the second just
 * past Q4 with Motion overtaking — and the collapse at 96 carries the third.
 */
export const BarChartRacePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={56}>
    <BarChartRace
      series={SERIES}
      steps={STEPS}
      width={780}
      rowHeight={52}
      framesPerStep={18}
      delayInFrames={4}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
