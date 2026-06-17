"use client";

import { LowerThird } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const LowerThirdPreview: React.FC = () => (
  <ScenePreviewPlate mediaSrc={DEMO_MEDIA_SRC}>
    <LowerThird
      title="Mina Patel"
      subtitle="Founder, Northstar Studio"
    />
  </ScenePreviewPlate>
);
