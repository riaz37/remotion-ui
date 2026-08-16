"use client";

import { OrgChartBuild } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Levels land 0.62s apart, so frame 18 catches the root, frame 60 (2.0s) the
 * third level's connectors drawing ahead of its nodes, and `holdSeconds={3.4}`
 * puts frame 108 mid-exit. See docs-internal/preview-audit-rubric.md.
 */
export const OrgChartBuildPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <OrgChartBuild holdSeconds={3.4} />
  </ScenePreviewPlate>
);
