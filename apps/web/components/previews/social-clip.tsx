"use client";

import { SocialClip } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_CAPTIONS } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const SocialClipPreview: React.FC = () => (
  <PreviewFrame>
    <SocialClip audioSrc={DEMO_AUDIO_SRC} captions={DEMO_CAPTIONS} />
  </PreviewFrame>
);
