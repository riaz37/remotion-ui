"use client";

import { FormFillSequence } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. Frame 18 catches the first field typing, frame 60 the
 * third, and `holdSeconds={3.4}` puts frame 108 mid-exit rather than on a
 * settled card. See docs-internal/preview-audit-rubric.md.
 */
export const FormFillSequencePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <FormFillSequence holdSeconds={3.4} />
  </ScenePreviewPlate>
);
