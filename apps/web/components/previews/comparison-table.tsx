"use client";

import { ComparisonTable } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Rows wipe in every 0.26s from 0.5s and the last cell resolves at ~2.2s, so
 * frame 18 has the header arriving, frame 60 (2.0s) the final rows still
 * filling, and `holdSeconds={3.4}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ComparisonTablePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ComparisonTable holdSeconds={3.4} />
  </ScenePreviewPlate>
);
