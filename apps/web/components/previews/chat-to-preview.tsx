"use client";

import { ChatToPreview } from "../../registry/bases/default/scenes/chat-to-preview";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const ChatToPreviewPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <ChatToPreview />
  </ScenePreviewPlate>
);
