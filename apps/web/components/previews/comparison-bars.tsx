"use client";

import { ComparisonBars } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const ROWS = [
  { label: "Time to first cut", before: 240, after: 96 },
  { label: "Renders / week", before: 120, after: 310 },
  { label: "Components used", before: 34, after: 88 },
  { label: "Manual retimes", before: 62, after: 18 },
];

/**
 * Samples land at frames 18, 60 and 108. Four pairs of 34-frame growths on an
 * 18-frame stagger run from frame 4 to 98 — one pair is mid-growth at the first
 * sample and the third at the second — and the exit at 96 carries the third.
 */
export const ComparisonBarsPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <ComparisonBars
      rows={ROWS}
      seriesLabels={["Before", "After"]}
      width={780}
      rowHeight={64}
      gap={20}
      labelWidth={210}
      delayInFrames={4}
      durationInFrames={34}
      staggerInFrames={18}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
