"use client";

import { FaqAccordion } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Rows open at 0.55s, 1.55s and 2.55s over 0.55s each, so frame 18 catches the
 * first panel growing, frame 60 (2.0s) the handover between the first two, and
 * `holdSeconds={3.4}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const FaqAccordionPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <FaqAccordion holdSeconds={3.4} />
  </ScenePreviewPlate>
);
