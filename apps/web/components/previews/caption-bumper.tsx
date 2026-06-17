"use client";

import { CaptionBumper } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CaptionBumperPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CaptionBumper text="This is the moment viewers remember." />
  </ScenePreviewPlate>
);
