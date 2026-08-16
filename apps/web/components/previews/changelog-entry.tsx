"use client";

import { ChangelogEntry } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Change rows land every 0.28s from 0.66s and the last resolves at ~2.24s, so
 * frame 18 catches the version and rule, frame 60 (2.0s) the closing rows, and
 * `holdSeconds={3.4}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ChangelogEntryPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ChangelogEntry holdSeconds={3.4} />
  </ScenePreviewPlate>
);
