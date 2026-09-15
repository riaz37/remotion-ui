"use client";

import type { ComponentType } from "react";
import { CreatorReel } from "@/registry/bases/default/compositions/creator-reel";
import { DataStory } from "@/registry/bases/default/compositions/data-story";
import { Intro } from "@/registry/bases/default/compositions/intro";
import { PodcastClip } from "@/registry/bases/default/compositions/podcast-clip";
import { SocialClip } from "@/registry/bases/default/compositions/social-clip";
import {
  DEMO_BAR_DATA,
  DEMO_CAPTIONS,
  DEMO_COPY,
  DEMO_LOGO_SRC,
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
  DEMO_METRICS,
  DEMO_SOCIAL_CLIP_CAPTIONS,
  DEMO_TIMELINE_STEPS,
} from "@/lib/demo-assets";
import { getComponentReference } from "@/lib/component-reference";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
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
    /** Gets the shared in-memory demo audio as `audioSrc` once it has loaded. */
    usesDemoAudio?: boolean;
  }
> = {
  "social-clip": {
    component: SocialClip as ComponentType<Record<string, unknown>>,
    usesDemoAudio: true,
    baseProps: {
      captions: DEMO_SOCIAL_CLIP_CAPTIONS,
      logoSrc: DEMO_LOGO_SRC,
      hookTitle: DEMO_COPY.productLaunch.title,
      hookSubtitle: DEMO_COPY.productLaunch.subtitle,
      podcastTitle: siteConfig.name,
      ctaTitle: siteConfig.name,
      ctaLabel: DEMO_COPY.endCard.ctaLabel,
      ctaUrl: DEMO_COPY.endCard.ctaUrl,
    },
  },
  "creator-reel": {
    component: CreatorReel as ComponentType<Record<string, unknown>>,
    usesDemoAudio: true,
    baseProps: {
      hookHeadline: DEMO_COPY.creatorHook.headline,
      hookSubtitle: DEMO_COPY.creatorHook.subtitle,
      talkingHeadEyebrow: DEMO_COPY.creatorHook.eyebrow,
      talkingHeadTitle: DEMO_COPY.productLaunch.title,
      mediaSrc: DEMO_MEDIA_ALT_SRC,
      mediaFit: "contain",
      captions: DEMO_CAPTIONS,
      comment: DEMO_COPY.creatorComment.body,
      author: DEMO_COPY.creatorComment.author,
      handle: DEMO_COPY.creatorComment.handle,
      bRollItems: [
        { src: DEMO_MEDIA_SRC, title: DEMO_COPY.productLaunch.featureItems[0] },
        { src: DEMO_MEDIA_ALT_SRC, title: DEMO_COPY.productLaunch.featureItems[1] },
        { src: DEMO_MEDIA_THIRD_SRC, title: DEMO_COPY.productLaunch.featureItems[2] },
      ],
      bRollTitle: DEMO_COPY.productLaunch.featureTitle,
      ctaTitle: DEMO_COPY.productLaunch.subtitle,
      ctaLabel: DEMO_COPY.endCard.ctaLabel,
    },
  },
  intro: {
    component: Intro as ComponentType<Record<string, unknown>>,
    baseProps: {
      title: DEMO_COPY.productLaunch.title,
      subtitle: DEMO_COPY.productLaunch.subtitle,
    },
  },
  "podcast-clip": {
    component: PodcastClip as ComponentType<Record<string, unknown>>,
    usesDemoAudio: true,
    baseProps: {
      captions: DEMO_CAPTIONS,
      title: DEMO_COPY.podcast.title,
      subtitle: DEMO_COPY.podcast.subtitle,
      ctaTitle: DEMO_COPY.productLaunch.title,
      ctaLabel: DEMO_COPY.productLaunch.subtitle,
    },
  },
  "data-story": {
    component: DataStory as ComponentType<Record<string, unknown>>,
    baseProps: {
      title: DEMO_COPY.dataStory.title,
      subtitle: DEMO_COPY.dataStory.subtitle,
      chartTitle: DEMO_COPY.dataStory.chartTitle,
      metricsTitle: DEMO_COPY.dataStory.metricsTitle,
      timelineTitle: DEMO_COPY.dataStory.timelineTitle,
      insight: DEMO_COPY.quote.text,
      insightEyebrow: DEMO_COPY.dataStory.insightEyebrow,
      ctaTitle: DEMO_COPY.dataStory.ctaTitle,
      ctaLabel: DEMO_COPY.endCard.ctaLabel,
      barData: DEMO_BAR_DATA,
      metrics: DEMO_METRICS,
      steps: DEMO_TIMELINE_STEPS,
    },
  },
};

export function CompositionPlaygroundSection({ name }: { name: string }) {
  // Called before the early returns so hook order stays stable.
  const audioSrc = useDemoAudioSrc();

  if (!hasCompositionPlayground(name)) {
    return null;
  }

  const meta = getCompositionPlaygroundMeta(name);
  const runtime = PLAYGROUND_COMPONENTS[name];
  const reference = getComponentReference(name);

  if (!meta || !runtime || !reference) {
    return null;
  }

  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (runtime.usesDemoAudio && !audioSrc) {
    return null;
  }

  return (
    <PropsPlayground
      name={name}
      component={runtime.component}
      baseProps={
        runtime.usesDemoAudio
          ? { ...runtime.baseProps, audioSrc }
          : runtime.baseProps
      }
      editablePropNames={meta.editablePropNames}
      propDefinitions={reference.props}
      durationInFrames={meta.durationInFrames}
      previewWidth={meta.previewWidth}
      previewHeight={meta.previewHeight}
    />
  );
}
