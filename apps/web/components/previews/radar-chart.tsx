"use client";

import { RadarChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const AXES = ["Speed", "Polish", "Reuse", "Docs", "Types", "Motion"];

const SERIES = [
  { label: "Hand-rolled", values: [42, 38, 24, 30, 46, 34] },
  { label: "RemotionUI", values: [88, 92, 84, 78, 90, 86] },
];

/**
 * Samples land at frames 18, 60 and 108. Two polygons reach out axis by axis
 * from frame 12 to 93 — the first is half drawn at the first sample and the
 * second is mid-reach at the second — and the collapse at 96 pulls both back to
 * the centre for the third.
 */
export const RadarChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <RadarChart
      axes={AXES}
      series={SERIES}
      size={260}
      maxValue={100}
      delayInFrames={4}
      durationInFrames={20}
      staggerInFrames={7}
      seriesOffsetInFrames={26}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
