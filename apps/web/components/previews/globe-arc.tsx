"use client";

import { GlobeArc } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * Arcs draw 16 frames apart from frame 6 and the globe never stops turning, so
 * frames 18 / 60 / 108 differ whether or not an arc happens to be drawing. See
 * docs-internal/preview-audit-rubric.md.
 */
export const GlobeArcPreview: React.FC = () => (
  <PreviewFrame lane="spatial">
    <GlobeArc size={380} />
  </PreviewFrame>
);
