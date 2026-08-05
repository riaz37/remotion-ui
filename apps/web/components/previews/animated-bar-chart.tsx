"use client";

import { AnimatedBarChart } from "../registry-exports";
import { DEMO_BAR_DATA, DEMO_PALETTE } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AnimatedBarChartPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <AnimatedBarChart
      title="Views by format"
      subtitle="Last quarter, all channels"
      data={DEMO_BAR_DATA}
      highlightLabel="Shorts"
      accentColor={DEMO_PALETTE.phosphor}
    />
  </ScenePreviewPlate>
);
