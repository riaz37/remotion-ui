"use client";

import { FeatureList } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const FeatureListPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <FeatureList
      title={DEMO_COPY.productLaunch.featureTitle}
      items={[...DEMO_COPY.productLaunch.featureItems]}
    />
  </ScenePreviewPlate>
);
