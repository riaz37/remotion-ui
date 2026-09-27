"use client";

import { Loop, useVideoConfig } from "remotion";
import { CaptionScene } from "../../registry/bases/default/scenes/caption-scene";
import {
  DEMO_CAPTIONS,
  DEMO_MEDIA_ALT_SRC,
  DEMO_PALETTE,
} from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The scene's page sequence ends with the last word, so the loop has to restart
 * right after it: a longer tail leaves the frame with no caption plate at all.
 */
const LOOP_SECONDS = 2.1;

export const CaptionScenePreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    // Captions are an overlay: showing them over demo footage is the actual
    // use case, and it proves the shadow/scrim treatment reads directly on
    // real video with no card underneath it.
    <ScenePreviewPlate mediaSrc={DEMO_MEDIA_ALT_SRC}>
      <Loop durationInFrames={Math.round(LOOP_SECONDS * fps)}>
        <CaptionScene
          captions={DEMO_CAPTIONS}
          placement="lower-third"
          mode="highlight"
          style="shadow"
          activeColor={DEMO_PALETTE.phosphor}
          backgroundColor="transparent"
        />
      </Loop>
    </ScenePreviewPlate>
  );
};
