"use client";

import { Sequence } from "remotion";
import { SocialClip } from "../../registry/bases/default/compositions/social-clip";
import {
  DEMO_COPY,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { siteConfig } from "@/lib/site-config";
import { PreviewFrame } from "./preview-frame";

export const SocialClipPreview: React.FC = () => {
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;
  return (
  <PreviewFrame lane="reels" padding={0}>
    <Sequence from={0}>
      <SocialClip
        audioSrc={audioSrc}
        captions={DEMO_SOCIAL_CLIP_CAPTIONS}
        logoSrc={DEMO_LOGO_SRC}
        hookTitle={DEMO_COPY.productLaunch.title}
        hookSubtitle={DEMO_COPY.productLaunch.subtitle}
        podcastTitle={siteConfig.name}
        ctaTitle={siteConfig.name}
        ctaLabel={DEMO_COPY.endCard.ctaLabel}
        ctaUrl={DEMO_COPY.endCard.ctaUrl}
      />
    </Sequence>
  </PreviewFrame>
  );
};
