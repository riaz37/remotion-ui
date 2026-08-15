"use client";

import { CaptionEmojiBeat } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. Motion must still be running at frame 18 and not yet
 * settled at 60, or all three samples land on a still image and the preview is
 * reported dead. See docs-internal/preview-audit-rubric.md.
 */
export const CaptionEmojiBeatPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <div style={{ display: "grid", placeItems: "center", width: "100%" }}>
      <CaptionEmojiBeat delayInFrames={2} durationInFrames={40} />
    </div>
  </PreviewFrame>
);
