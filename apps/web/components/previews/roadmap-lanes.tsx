"use client";

import { RoadmapLanes } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Lanes fill 0.42s apart and the last progress bar is still growing at ~2.6s,
 * so frame 18 has the shipped lane arriving, frame 60 (2.0s) the building lane
 * mid-fill, and `holdSeconds={3.27}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const RoadmapLanesPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <RoadmapLanes holdSeconds={3.27} />
  </ScenePreviewPlate>
);
