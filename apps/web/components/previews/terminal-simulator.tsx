"use client";

import { TerminalSimulator } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const TerminalSimulatorPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TerminalSimulator />
  </ScenePreviewPlate>
);
