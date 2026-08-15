"use client";

import { BubbleChartPack } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const BUBBLES = [
  { label: "Atoms", value: 42 },
  { label: "Blocks", value: 31 },
  { label: "Signals", value: 26 },
  { label: "Cuts", value: 18 },
  { label: "Reels", value: 12 },
];

/**
 * Samples land at frames 18, 60 and 108. Seven bubbles on a 12-frame stagger
 * settle from frame 6 to 100, so the cluster is two bubbles in at the first
 * sample and five at the second, with the contraction at 96 running under the
 * third.
 */
export const BubbleChartPackPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <BubbleChartPack
      bubbles={BUBBLES}
      width={780}
      height={380}
      delayInFrames={6}
      durationInFrames={26}
      staggerInFrames={12}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
