"use client";

import { Sequence } from "remotion";
import { SocialClip } from "../registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { siteConfig } from "@/lib/site-config";
import { PreviewFrame } from "./preview-frame";

export const SocialClipPreview: React.FC = () => (
  <PreviewFrame lane="reels" padding={0}>
    <Sequence from={-70}>
      <SocialClip
        audioSrc={DEMO_AUDIO_SRC}
        captions={DEMO_SOCIAL_CLIP_CAPTIONS}
        logoSrc={DEMO_LOGO_SRC}
        hookTitle="Production-ready motion"
        hookSubtitle="for Remotion. Source you own."
        podcastTitle={siteConfig.name}
        ctaTitle={siteConfig.name}
        ctaLabel="npx remotion-ui add"
        ctaUrl="remotionui.com"
      />
    </Sequence>
  </PreviewFrame>
);
