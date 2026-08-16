"use client";

import { BadgeStamp } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The stamp lands from frame 14, so frame 18 catches the impact with the
 * shockwave still expanding and frame 60 the settled seal; the exit at frame 92
 * covers frame 108. See docs-internal/preview-audit-rubric.md.
 */
export const BadgeStampPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <BadgeStamp size={260} delayInFrames={14} exitAtInFrames={92} />
  </PreviewFrame>
);
