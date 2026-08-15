"use client";

import { CommitGraph } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Commits land every 0.36s from 0.34s, so frame 18 has the first edge drawing,
 * frame 60 (2.0s) the merge curve still growing, and `holdSeconds={3.4}` puts
 * frame 108 mid-exit. See docs-internal/preview-audit-rubric.md.
 */
export const CommitGraphPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CommitGraph holdSeconds={3.4} />
  </ScenePreviewPlate>
);
