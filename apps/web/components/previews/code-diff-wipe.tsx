"use client";

import { CodeDiffWipe } from "../../registry/bases/default/scenes/code-diff-wipe";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeDiffWipePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeDiffWipe />
  </ScenePreviewPlate>
);
