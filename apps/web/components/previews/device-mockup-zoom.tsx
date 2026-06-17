"use client";

import { Sequence } from "remotion";
import { DeviceMockupZoom } from "../registry-exports";
import { DEMO_COPY, DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const DeviceMockupZoomPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <DeviceMockupZoom device="phone" />
    </Sequence>
  </ScenePreviewPlate>
);
