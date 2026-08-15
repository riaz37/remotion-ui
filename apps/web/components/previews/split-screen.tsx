"use client";

import { SplitScreen } from "../registry-exports";
import { DEMO_MEDIA_ALT_PLAIN_SRC, DEMO_MEDIA_PLAIN_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const SplitScreenPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    {/* The wipe is the move a before/after is for, and without it the tile
        holds an even split for its whole loop. */}
    <SplitScreen
      title="Before / after workflow"
      left={{ src: DEMO_MEDIA_PLAIN_SRC, label: "Prototype" }}
      right={{ src: DEMO_MEDIA_ALT_PLAIN_SRC, label: "Final clip" }}
      wipeAtSeconds={2.2}
    />
  </ScenePreviewPlate>
);
