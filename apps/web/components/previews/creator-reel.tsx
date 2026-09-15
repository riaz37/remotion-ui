"use client";

import { Sequence } from "remotion";
import { CreatorReel } from "../../registry/bases/default/compositions/creator-reel";
import {
  DEMO_CAPTIONS,
  DEMO_COPY,
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
  DEMO_SPEAKER_SRC,
} from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { siteConfig } from "@/lib/site-config";

export const CreatorReelPreview: React.FC = () => {
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;
  return (
  <Sequence from={0}>
    <CreatorReel
      hookHeadline={DEMO_COPY.creatorHook.headline}
      hookSubtitle={DEMO_COPY.creatorHook.subtitle}
      talkingHeadEyebrow={DEMO_COPY.creatorHook.eyebrow}
      talkingHeadTitle={DEMO_COPY.productLaunch.title}
      mediaSrc={DEMO_SPEAKER_SRC}
      mediaFit="cover"
      audioSrc={audioSrc}
      captions={DEMO_CAPTIONS}
      comment={DEMO_COPY.creatorComment.body}
      author={DEMO_COPY.creatorComment.author}
      handle={DEMO_COPY.creatorComment.handle}
      bRollItems={[
        { src: DEMO_MEDIA_SRC, title: DEMO_COPY.productLaunch.featureItems[0] },
        { src: DEMO_MEDIA_ALT_SRC, title: DEMO_COPY.productLaunch.featureItems[1] },
        { src: DEMO_MEDIA_THIRD_SRC, title: DEMO_COPY.productLaunch.featureItems[2] },
      ]}
      bRollTitle={DEMO_COPY.productLaunch.featureTitle}
      ctaTitle={DEMO_COPY.productLaunch.subtitle}
      ctaLabel={DEMO_COPY.endCard.ctaLabel}
    />
  </Sequence>
  );
};
