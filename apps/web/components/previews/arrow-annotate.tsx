"use client";

import { ArrowAnnotate } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The shaft draws over frames 6–76 so frame 18 is early in the stroke and frame
 * 60 is near its end; the exit at frame 92 covers frame 108. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ArrowAnnotatePreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <ArrowAnnotate
      label="this one"
      width={420}
      height={260}
      durationInFrames={70}
      exitAtInFrames={92}
    />
  </PreviewFrame>
);
