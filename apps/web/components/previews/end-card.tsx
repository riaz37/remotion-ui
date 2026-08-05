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
      subtitle="Copy the scenes into your repo and render today."
      handles={["@remotionui", "github.com/remotion-ui"]}
    />
  </ScenePreviewPlate>
);
