"use client";

import type { ComponentType } from "react";
import {
  CreatorReel,
  DataStory,
  Intro,
  PodcastClip,
  SocialClip,
} from "@/components/registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_BAR_DATA,
  DEMO_CAPTIONS,
  DEMO_LOGO_SRC,
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
  DEMO_METRICS,
  DEMO_SOCIAL_CLIP_CAPTIONS,
  DEMO_TIMELINE_STEPS,
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
      hookSubtitle: "Source you own. Install with the CLI.",
      ctaLabel: "Build your next clip",
      comment: "Can you turn this into a quick video breakdown?",
    },
  },
  intro: {
    component: Intro as ComponentType<Record<string, unknown>>,
    baseProps: {
      title: "Launch Brief",
      subtitle: "A clean opener for product videos",
    },
  },
  "podcast-clip": {
    component: PodcastClip as ComponentType<Record<string, unknown>>,
    baseProps: {
      audioSrc: DEMO_AUDIO_SRC,
      captions: DEMO_CAPTIONS,
      title: "Podcast highlight",
      subtitle: "A clip ready for social",
      ctaTitle: "Audio Cut",
      ctaLabel: "Make audio visual",
    },
  },
  "data-story": {
    component: DataStory as ComponentType<Record<string, unknown>>,
    baseProps: {
      title: "Data story",
      subtitle: "Explain the trend in one minute",
      insight: "The strongest stories turn numbers into sequence.",
      ctaTitle: "Data Cut",
      ctaLabel: "Build the next story",
      barData: DEMO_BAR_DATA,
      metrics: DEMO_METRICS,
      steps: DEMO_TIMELINE_STEPS,
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
