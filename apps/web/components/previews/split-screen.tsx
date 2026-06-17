"use client";

import { SplitScreen } from "../registry-exports";
import { DEMO_MEDIA_ALT_SRC, DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const SplitScreenPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <SplitScreen
      title="Before / after workflow"
      left={{ src: DEMO_MEDIA_SRC, label: "Prototype" }}
      right={{ src: DEMO_MEDIA_ALT_SRC, label: "Final clip" }}
    />
  </ScenePreviewPlate>
);
