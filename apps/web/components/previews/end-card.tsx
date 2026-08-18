"use client";

import { EndCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * `holdSeconds` leaves across the 90% sample (frame 135 of 150 = 4.5s):
 * 0.9 x 150/30 - 0.79 x 0.42 = 4.17. Without it every beat was over by frame
 * 90 and the back 40% of the loop was one still card.
 */
export const EndCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <EndCard
      holdSeconds={4.17}
      title="Ready to ship?"
      cta={DEMO_COPY.endCard.ctaLabel}
      url={DEMO_COPY.endCard.ctaUrl}
      subtitle="Copy the scenes into your repo and render today."
      handles={["@remotionui", "github.com/remotion-ui"]}
    />
  </ScenePreviewPlate>
);
