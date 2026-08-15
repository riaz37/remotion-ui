"use client";

import { FileTreeReveal } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Eleven rows on a 0.18s stagger keep the tree opening across frames 18 and 60 —
 * the last row lands at 2.6s and the selection at 2.8s, and `holdSeconds={3.4}` puts frame 108 mid-exit.
 * See docs-internal/preview-audit-rubric.md.
 */
export const FileTreeRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <FileTreeReveal holdSeconds={3.4} />
  </ScenePreviewPlate>
);
