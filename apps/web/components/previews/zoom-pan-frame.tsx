"use client";

import { ZoomPanFrame } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const ZoomPanFramePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ZoomPanFrame src={DEMO_MEDIA_SRC} toScale={1.28} toX={-80} toY={36} />
  </ScenePreviewPlate>
);
