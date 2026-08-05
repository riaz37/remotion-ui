"use client";

import { MediaFrame } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const MediaFramePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <MediaFrame
      src={DEMO_MEDIA_SRC}
      eyebrow="Chapter 02"
      title="Product tour"
      caption="Frame the product in one glance."
    />
  </ScenePreviewPlate>
);
