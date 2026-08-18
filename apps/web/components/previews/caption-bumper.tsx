"use client";

import { CaptionBumper } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CaptionBumperPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    {/* Without a hold the bumper lands at ~1.5s and sits for the remaining
        three seconds of the 140-frame window. The exit is timed to straddle
        the audit's 90% sample (frame 126 = 4.2s) rather than finish before it,
        which would leave the tile empty instead of leaving. */}
    <CaptionBumper
      text="This is the moment viewers remember."
      holdSeconds={3.92}
    />
  </ScenePreviewPlate>
);
