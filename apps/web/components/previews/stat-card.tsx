"use client";

import { StatCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const StatCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <StatCard
      value={DEMO_COPY.dataStory.statValue}
      label={DEMO_COPY.dataStory.statLabel}
      suffix={DEMO_COPY.dataStory.statSuffix}
    />
  </ScenePreviewPlate>
);
