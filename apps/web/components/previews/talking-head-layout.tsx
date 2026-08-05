"use client";

import { Sequence } from "remotion";
import { TalkingHeadLayout } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_SPEAKER_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const TalkingHeadLayoutPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <TalkingHeadLayout
        mediaSrc={DEMO_SPEAKER_SRC}
        audioSrc={DEMO_AUDIO_SRC}
        fit="cover"
        eyebrow="On camera"
        title="Maya Okonkwo"
        subtitle="Founder, Northlight Studio"
        captions={[
          "Keep the speaker readable.",
          "Reserve the lower frame",
          "for captions and platform UI.",
        ]}
      />
    </Sequence>
  </ScenePreviewPlate>
);
