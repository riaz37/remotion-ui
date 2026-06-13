"use client";

import { WaveformLine } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const WaveformLinePreview: React.FC = () => (
  <PreviewFrame lane="signals">
    <WaveformLine src={DEMO_AUDIO_SRC} height={140} mirror />
  </PreviewFrame>
);
