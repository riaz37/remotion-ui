"use client";

import { TeamGrid } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Members arrive every 0.2s from 0.4s, so the last tile is still landing at
 * ~2.25s: frame 18 catches the first row, frame 60 (2.0s) the last, and
 * `holdSeconds={3.27}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const TeamGridPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TeamGrid holdSeconds={3.27} />
  </ScenePreviewPlate>
);
