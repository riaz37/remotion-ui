"use client";

import { Sequence } from "remotion";
import { TalkingHeadLayout } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_MEDIA_ALT_SRC } from "@/lib/demo-assets";

export const TalkingHeadLayoutPreview: React.FC = () => (
  <Sequence from={-32}>
    <TalkingHeadLayout
      mediaSrc={DEMO_MEDIA_ALT_SRC}
      audioSrc={DEMO_AUDIO_SRC}
      fit="contain"
      title="Keep the speaker readable"
      subtitle="Reserve the lower frame for captions and platform UI."
    />
  </Sequence>
);
