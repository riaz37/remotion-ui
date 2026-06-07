"use client";

import { AudioPulse } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudioPulsePreview: React.FC = () => (
  <PreviewFrame backgroundColor="#0f172a">
    <AudioPulse src={DEMO_AUDIO_SRC} />
  </PreviewFrame>
);
