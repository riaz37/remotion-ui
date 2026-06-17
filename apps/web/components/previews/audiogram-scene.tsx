"use client";

import { Audio } from "@remotion/media";
import { AudiogramScene } from "../registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_COPY,
  DEMO_LOGO_SRC,
} from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AudiogramScenePreview: React.FC = () => (
  <ScenePreviewPlate>
    <Audio src={DEMO_AUDIO_SRC} loop />
    <AudiogramScene
      src={DEMO_AUDIO_SRC}
      title={DEMO_COPY.podcast.title}
      subtitle={DEMO_COPY.podcast.subtitle}
      logoSrc={DEMO_LOGO_SRC}
    />
  </ScenePreviewPlate>
);
