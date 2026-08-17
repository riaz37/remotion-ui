"use client";

import { BadgeStamp } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * `delayInFrames={15}` puts frame 18 three frames into a very stiff landing
 * spring — the seal still oversized and mid-descent with the shockwave already
 * outside it, which is the pose the component exists for. The spring settles in
 * about six frames, so a frame either side of this loses one or the other.
 * Frame 60 is the settled seal, and
 * the exit at frame 95 lands frame 108 halfway through the 16-frame exit
 * (cubic-in, so 0.79 of the window). See docs-internal/preview-audit-rubric.md.
 */
export const BadgeStampPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <BadgeStamp size={360} delayInFrames={15} exitAtInFrames={95} />
  </PreviewFrame>
);
