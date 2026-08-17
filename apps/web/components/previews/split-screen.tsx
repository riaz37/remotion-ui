"use client";

import { SplitScreen } from "../registry-exports";
import { DEMO_MEDIA_ALT_PLAIN_SRC, DEMO_MEDIA_PLAIN_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const SplitScreenPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    {/* The wipe is the move a before/after is for, and without it the tile
        holds an even split for its whole loop.

        On the 120-frame window the audit samples frames 18 / 60 / 108. The wipe
        runs 1.6s → 2.7s (frames 48-81) so frame 60 is mid-travel rather than
        either end of it, and `holdSeconds={3.27}` leaves the scene across frame
        108 — `0.9·120/30 − 0.79·0.42`, since the exit curve is
        `Easing.in(Easing.cubic)` and not linear. The old 165-frame window
        finished everything by frame 99 and spent its last 40% frozen. */}
    <SplitScreen
      title="Before / after workflow"
      left={{ src: DEMO_MEDIA_PLAIN_SRC, label: "Prototype" }}
      right={{ src: DEMO_MEDIA_ALT_PLAIN_SRC, label: "Final clip" }}
      wipeAtSeconds={1.6}
      holdSeconds={3.27}
    />
  </ScenePreviewPlate>
);
