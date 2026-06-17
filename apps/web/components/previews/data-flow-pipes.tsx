"use client";

import { DataFlowPipes } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const DataFlowPipesPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <DataFlowPipes />
  </ScenePreviewPlate>
);
