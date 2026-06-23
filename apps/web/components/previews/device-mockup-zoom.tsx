"use client";

import { Sequence } from "remotion";
import { DeviceMockupZoom } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const DeviceMockupZoomPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <DeviceMockupZoom device="laptop" />
    </Sequence>
  </ScenePreviewPlate>
);
