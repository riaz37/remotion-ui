"use client";

import { DragDropFlow } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const DragDropFlowPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <DragDropFlow />
  </ScenePreviewPlate>
);
