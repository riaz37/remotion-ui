"use client";

import { MetricTicker } from "../registry-exports";
import { DEMO_METRICS } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const MetricTickerPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <MetricTicker title="Channel momentum" metrics={DEMO_METRICS} />
  </ScenePreviewPlate>
);
