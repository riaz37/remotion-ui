"use client";

import { CaptionScene } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const CaptionScenePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <CaptionScene
      captions={DEMO_CAPTIONS}
      placement="center"
      backgroundColor="transparent"
    />
  </PreviewFrame>
);
