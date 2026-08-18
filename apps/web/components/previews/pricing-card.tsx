"use client";

import { PricingCard } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Frame 18 lands mid price-roll (0.42s–1.32s), frame 60 (2.0s) on the last
 * features ticking in ahead of the CTA at 2.09s, and `holdSeconds={3.27}` puts
 * frame 108 mid-exit. See docs-internal/preview-audit-rubric.md.
 */
export const PricingCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <PricingCard holdSeconds={3.27} />
  </ScenePreviewPlate>
);
