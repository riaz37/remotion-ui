"use client";

import { CodeDiffWipe } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeDiffWipePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeDiffWipe />
  </ScenePreviewPlate>
);
