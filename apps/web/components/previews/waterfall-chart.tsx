"use client";

import { WaterfallChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const STEPS = [
  { label: "Q1 open", value: 320, isTotal: true },
  { label: "New", value: 180 },
  { label: "Expansion", value: 96 },
  { label: "Churn", value: -74 },
  { label: "Downgrade", value: -38 },
  { label: "Q2 close", value: 484, isTotal: true },
];

/**
 * Samples land at frames 18, 60 and 108. Six bars of 22 frames on a 15-frame
 * stagger build from frame 4 to 101 — the bridge is one step in at the first
 * sample and four at the second — and the exit at 96 overlaps the last of it.
 */
export const WaterfallChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <WaterfallChart
      steps={STEPS}
      width={780}
      height={380}
      delayInFrames={4}
      durationInFrames={22}
      staggerInFrames={15}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
