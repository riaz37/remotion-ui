"use client";

import { EndCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const EndCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <EndCard
      title="Ready to ship?"
      cta={DEMO_COPY.endCard.ctaLabel}
      url={DEMO_COPY.endCard.ctaUrl}
    />
  </ScenePreviewPlate>
);
