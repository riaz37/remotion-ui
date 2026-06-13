"use client";

import { AudiogramScene } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudiogramScenePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AudiogramScene src={DEMO_AUDIO_SRC} title="Founder Notes" />
  </PreviewFrame>
);
