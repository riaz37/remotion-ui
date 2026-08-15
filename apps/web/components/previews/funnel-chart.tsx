"use client";

import { FunnelChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const STAGES = [
  { label: "Visited docs", value: 42800 },
  { label: "Ran the CLI", value: 18600 },
  { label: "Added a component", value: 9400 },
  { label: "Rendered a video", value: 4100 },
  { label: "Shipped it", value: 1750 },
];

/**
 * Samples land at frames 18, 60 and 108. Five bands of 24 frames on a 15-frame
 * stagger wipe from frame 4 to 88, with the drop-off chips landing behind them,
 * so the first sample catches band two and the second band five; the bottom-up
 * drain at 96 covers the third.
 */
export const FunnelChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <FunnelChart
      stages={STAGES}
      width={720}
      height={380}
      delayInFrames={4}
      durationInFrames={24}
      staggerInFrames={15}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
