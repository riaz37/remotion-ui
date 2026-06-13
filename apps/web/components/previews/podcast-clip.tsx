"use client";

import { Sequence } from "remotion";
import { PodcastClip } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_CAPTIONS } from "@/lib/demo-assets";

export const PodcastClipPreview: React.FC = () => (
  <Sequence from={-70}>
    <PodcastClip
      audioSrc={DEMO_AUDIO_SRC}
      captions={DEMO_CAPTIONS}
      title="Founder Notes"
      subtitle="A highlight ready for social"
      ctaTitle="Audio Cut"
      ctaLabel="Turn the quote into a clip"
    />
  </Sequence>
);
