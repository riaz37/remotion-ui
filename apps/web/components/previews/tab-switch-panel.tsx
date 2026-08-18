"use client";

import { TabSwitchPanel } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Switches fire at 0.95s, 1.85s and 2.75s, so frame 18 lands on the window
 * still opening, frame 60 (2.0s) a fifth of the way through the second switch,
 * and `holdSeconds={3.27}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const TabSwitchPanelPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TabSwitchPanel holdSeconds={3.27} />
  </ScenePreviewPlate>
);
