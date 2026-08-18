"use client";

import { DragDropFlow } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The upload finishes at 4.05s of the 5s window, so the tail was a settled
 * card. `holdSeconds` is the corrected recipe — `0.9 * window / fps - 0.79 *
 * exitFor`, 4.5 - 0.33 — which starts the retreat as the done state lands and
 * straddles the audit's 90% sample with its eased midpoint.
 */
export const DragDropFlowPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <DragDropFlow holdSeconds={4.17} />
  </ScenePreviewPlate>
);
