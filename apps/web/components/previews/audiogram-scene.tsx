"use client";

import { AudiogramScene } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudiogramScenePreview: React.FC = () => (
  <PreviewFrame backgroundColor="#0f172a">
    <AudiogramScene src={DEMO_AUDIO_SRC} title="RemotionUI Podcast" />
  </PreviewFrame>
);
