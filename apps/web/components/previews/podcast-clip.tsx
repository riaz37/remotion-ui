"use client";

import { Sequence } from "remotion";
import { PodcastClip } from "../../registry/bases/default/compositions/podcast-clip";
import { DEMO_CAPTIONS, DEMO_COPY } from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";

export const PodcastClipPreview: React.FC = () => {
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;
  return (
  <Sequence from={0}>
    <PodcastClip
      audioSrc={audioSrc}
      captions={DEMO_CAPTIONS}
      title={DEMO_COPY.podcast.title}
      subtitle={DEMO_COPY.podcast.subtitle}
      ctaTitle={DEMO_COPY.productLaunch.title}
      ctaLabel={DEMO_COPY.endCard.ctaLabel}
    />
  </Sequence>
  );
};
