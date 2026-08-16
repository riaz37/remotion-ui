"use client";

import { LogoWall } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The diagonal sweep runs to ~2.15s, so frame 18 has the first tiles warming,
 * frame 60 (2.0s) the far corner still grey, and `holdSeconds={3.4}` puts frame
 * 108 mid-exit. See docs-internal/preview-audit-rubric.md.
 */
export const LogoWallPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <LogoWall holdSeconds={3.4} />
  </ScenePreviewPlate>
);
