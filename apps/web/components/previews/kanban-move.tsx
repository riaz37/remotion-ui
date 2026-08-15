"use client";

import { KanbanMove } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Cards deal in through 0.7s, then moves fire at 0.95s and 1.72s — frame 18
 * catches the deal, frame 60 (2.0s) the second card mid-arc, and
 * `holdSeconds={3.4}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const KanbanMovePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <KanbanMove holdSeconds={3.4} />
  </ScenePreviewPlate>
);
