"use client";

import { CaptionScene } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CaptionScenePreview: React.FC = () => (
  <ScenePreviewPlate>
    <CaptionScene
      captions={DEMO_CAPTIONS}
      placement="lower-third"
      mode="highlight"
      backgroundColor="transparent"
    />
  </ScenePreviewPlate>
);
