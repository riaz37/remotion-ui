"use client";

import { Sequence } from "remotion";
import { PodcastClip } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_CAPTIONS, DEMO_COPY } from "@/lib/demo-assets";

export const PodcastClipPreview: React.FC = () => (
  <Sequence from={0}>
    <PodcastClip
      audioSrc={DEMO_AUDIO_SRC}
      captions={DEMO_CAPTIONS}
      title={DEMO_COPY.podcast.title}
      subtitle={DEMO_COPY.podcast.subtitle}
      ctaTitle={DEMO_COPY.productLaunch.title}
      ctaLabel={DEMO_COPY.productLaunch.subtitle}
    />
  </Sequence>
);
