"use client";

import type { ComponentType } from "react";
import {
  CreatorReel,
  Intro,
  SocialClip,
} from "@/components/registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_CAPTIONS,
  DEMO_LOGO_SRC,
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { getComponentReference } from "@/lib/component-reference";
import {
  getCompositionPlaygroundMeta,
  hasCompositionPlayground,
} from "@/lib/composition-playground";
import { siteConfig } from "@/lib/site-config";
import { PropsPlayground } from "./props-playground";

const PLAYGROUND_COMPONENTS: Record<
  string,
  {
    component: ComponentType<Record<string, unknown>>;
    baseProps: Record<string, unknown>;
  }
> = {
  "social-clip": {
    component: SocialClip as ComponentType<Record<string, unknown>>,
    baseProps: {
      audioSrc: DEMO_AUDIO_SRC,
      captions: DEMO_SOCIAL_CLIP_CAPTIONS,
      logoSrc: DEMO_LOGO_SRC,
      hookTitle: "Production-ready motion",
      hookSubtitle: "for Remotion. Source you own.",
      podcastTitle: siteConfig.name,
      ctaTitle: siteConfig.name,
      ctaLabel: "npx remotion-ui add",
      ctaUrl: "remotionui.com",
    },
  },
  "creator-reel": {
    component: CreatorReel as ComponentType<Record<string, unknown>>,
    baseProps: {
      hookHeadline: "Production-ready motion for Remotion",
      mediaSrc: DEMO_MEDIA_ALT_SRC,
      audioSrc: DEMO_AUDIO_SRC,
      captions: DEMO_CAPTIONS,
      bRollItems: [
        { src: DEMO_MEDIA_SRC, title: "Script" },
        { src: DEMO_MEDIA_ALT_SRC, title: "Record" },
        { src: DEMO_MEDIA_THIRD_SRC, title: "Publish" },
      ],
    },
  },
  intro: {
    component: Intro as ComponentType<Record<string, unknown>>,
    baseProps: {
      title: "Launch Brief",
      subtitle: "A clean opener for product videos",
    },
  },
};

export function CompositionPlaygroundSection({ name }: { name: string }) {
  if (!hasCompositionPlayground(name)) {
    return null;
  }

  const meta = getCompositionPlaygroundMeta(name);
  const runtime = PLAYGROUND_COMPONENTS[name];
  const reference = getComponentReference(name);

  if (!meta || !runtime || !reference) {
    return null;
  }

  return (
    <PropsPlayground
      name={name}
      component={runtime.component}
      baseProps={runtime.baseProps}
      editablePropNames={meta.editablePropNames}
      propDefinitions={reference.props}
      durationInFrames={meta.durationInFrames}
      previewWidth={meta.previewWidth}
      previewHeight={meta.previewHeight}
    />
  );
}
