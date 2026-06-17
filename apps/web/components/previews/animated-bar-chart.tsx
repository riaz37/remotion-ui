"use client";

import { AnimatedBarChart } from "../registry-exports";
import { DEMO_BAR_DATA, DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AnimatedBarChartPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <AnimatedBarChart
      title={DEMO_COPY.productLaunch.featureTitle}
      data={DEMO_BAR_DATA}
    />
  </ScenePreviewPlate>
);
