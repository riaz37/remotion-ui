"use client";

import { DonutChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const SEGMENTS = [
  { label: "Direct", value: 4820 },
  { label: "Search", value: 3140 },
  { label: "Social", value: 1960 },
  { label: "Referral", value: 880 },
];

/**
 * Samples land at frames 18, 60 and 108. The stagger spreads four sweeps from
 * frame 6 to frame 88, so the first sample catches the opening slice mid-draw,
 * the middle one lands between the third and fourth, and the exit at 96 keeps
 * the tail moving.
 */
export const DonutChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <DonutChart
      segments={SEGMENTS}
      size={340}
      totalLabel="Sessions"
      delayInFrames={6}
      durationInFrames={34}
      staggerInFrames={16}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
