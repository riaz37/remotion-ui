"use client";

import { DashedPathTravel } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The trip runs frames 4–90, so frame 18 is early on the route and frame 60
 * near its end; the exit at frame 92 covers frame 108. See
 * docs-internal/preview-audit-rubric.md.
 */
export const DashedPathTravelPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <DashedPathTravel
      width={460}
      height={260}
      delayInFrames={4}
      durationInFrames={86}
      exitAtInFrames={92}
    />
  </PreviewFrame>
);
