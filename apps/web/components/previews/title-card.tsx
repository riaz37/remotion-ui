"use client";

import { TitleCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const TitleCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TitleCard
      title={DEMO_COPY.productLaunch.title}
      subtitle={DEMO_COPY.productLaunch.subtitle}
    />
  </ScenePreviewPlate>
);
