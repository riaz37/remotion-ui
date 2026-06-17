"use client";

import { ChatToPreview } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const ChatToPreviewPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ChatToPreview />
  </ScenePreviewPlate>
);
