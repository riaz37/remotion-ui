"use client";

import { ZoomPanFrame } from "../registry-exports";
import { DEMO_MEDIA_PLAIN_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const ZoomPanFramePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ZoomPanFrame
      src={DEMO_MEDIA_PLAIN_SRC}
      from={{ x: 0.5, y: 0.5, scale: 1.02 }}
      to={{ x: 0.38, y: 0.4, scale: 1.2 }}
      label="Dashboard · 00:12"
    />
  </ScenePreviewPlate>
);
