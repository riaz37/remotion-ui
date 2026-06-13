"use client";

import { AudiogramBars } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudiogramBarsPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={48}>
    <AudiogramBars src={DEMO_AUDIO_SRC} height={180} />
  </PreviewFrame>
);
