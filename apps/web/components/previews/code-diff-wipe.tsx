"use client";

import { CodeDiffWipe } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeDiffWipePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeDiffWipe
      before={"const x = 1;\nreturn x;"}
      after={"const x = 2;\nreturn x * 2;"}
    />
  </ScenePreviewPlate>
);
