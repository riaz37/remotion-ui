"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { SocialClip } from "@/components/registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_COPY,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { getComponentReference } from "@/lib/component-reference";
import { getCompositionPlaygroundMeta } from "@/lib/composition-playground";
import { siteConfig } from "@/lib/site-config";
import { ProgramMonitorWorkspace } from "@/components/studio/program-monitor-workspace";
import { LandingSection } from "@/components/landing/landing-section";

const BASE_PROPS = {
  audioSrc: DEMO_AUDIO_SRC,
  captions: DEMO_SOCIAL_CLIP_CAPTIONS,
  logoSrc: DEMO_LOGO_SRC,
  hookTitle: DEMO_COPY.productLaunch.title,
  hookSubtitle: DEMO_COPY.productLaunch.subtitle,
  podcastTitle: siteConfig.name,
  ctaTitle: siteConfig.name,
  ctaLabel: DEMO_COPY.endCard.ctaLabel,
  ctaUrl: DEMO_COPY.endCard.ctaUrl,
};

const EDITABLE = ["hookTitle", "hookSubtitle", "ctaLabel", "logoSrc"] as const;

export function LandingLivePlayground() {
  const meta = getCompositionPlaygroundMeta("social-clip");
  const reference = getComponentReference("social-clip");

  const [values, setValues] = useState<Record<string, string>>(() => ({
    hookTitle: String(BASE_PROPS.hookTitle),
    hookSubtitle: String(BASE_PROPS.hookSubtitle),
    ctaLabel: String(BASE_PROPS.ctaLabel),
    logoSrc: String(BASE_PROPS.logoSrc),
  }));

  const inputProps = useMemo(
    () => ({ ...BASE_PROPS, ...values }),
    [values],
  );

  const usageSnippet = useMemo(() => {
    const propLines = EDITABLE.map((propName) => {
      const value = values[propName];
      if (!value) return null;
      return `  ${propName}="${value}"`;
    })
      .filter(Boolean)
      .join("\n");

    return `import { SocialClip } from "@/compositions/social-clip";

<SocialClip
${propLines}
/>`;
  }, [values]);

  if (!meta || !reference) return null;

  const fields = EDITABLE.map((name) => {
    const propDef = reference.props.find((p) => p.name === name);
    return {
      name,
      value: values[name] ?? "",
      onChange: (value: string) =>
        setValues((current) => ({ ...current, [name]: value })),
      placeholder: propDef?.description,
    };
  });

  return (
    <LandingSection
      title="Tweak the clip"
      lead="Drag props on a real composition. Watch the monitor update frame by frame."
      layout="wide"
      showTopPerforation={false}
    >
      <ProgramMonitorWorkspace
        label="social-clip"
        component={SocialClip as ComponentType<Record<string, unknown>>}
        durationInFrames={meta.durationInFrames}
        fps={30}
        width={meta.previewWidth}
        height={meta.previewHeight}
        inputProps={inputProps}
        fields={fields}
        usageSnippet={usageSnippet}
      />
    </LandingSection>
  );
}
