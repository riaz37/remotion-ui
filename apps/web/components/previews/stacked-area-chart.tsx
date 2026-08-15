"use client";

import { StackedAreaChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

const SERIES = [
  { label: "Reels", values: [140, 180, 210, 260, 300, 380, 430, 520] },
  { label: "Ads", values: [90, 120, 130, 180, 210, 240, 300, 340] },
  { label: "Docs", values: [60, 70, 110, 120, 160, 190, 210, 260] },
  { label: "Internal", values: [30, 40, 45, 70, 90, 110, 130, 150] },
];

/**
 * Samples land at frames 18, 60 and 108. The wipe crosses the plot over 62
 * frames from frame 4, each band trailing the one below it, so the chart is a
 * fifth uncovered at the first sample and most of the way at the second; the
 * retreat at 96 carries the third.
 */
export const StackedAreaChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <StackedAreaChart
      series={SERIES}
      labels={LABELS}
      width={800}
      height={370}
      delayInFrames={4}
      durationInFrames={62}
      bandOffsetInFrames={10}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
