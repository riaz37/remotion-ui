"use client";

import { Sequence } from "remotion";
import { SocialClip } from "../registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_COPY,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { siteConfig } from "@/lib/site-config";
import { PreviewFrame } from "./preview-frame";

export const SocialClipPreview: React.FC = () => (
  <PreviewFrame lane="reels" padding={0}>
    <Sequence from={0}>
      <SocialClip
        audioSrc={DEMO_AUDIO_SRC}
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
