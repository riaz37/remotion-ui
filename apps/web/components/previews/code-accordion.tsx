"use client";

import { CodeAccordion } from "../../registry/bases/default/scenes/code-accordion";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeAccordionPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeAccordion />
  </ScenePreviewPlate>
);
