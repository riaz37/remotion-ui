"use client";

import { CodeAccordion } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeAccordionPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeAccordion activeIndex={1} />
  </ScenePreviewPlate>
);
