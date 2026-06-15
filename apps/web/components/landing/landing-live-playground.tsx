"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { SocialClip } from "@/components/registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { getComponentReference } from "@/lib/component-reference";
import { getCompositionPlaygroundMeta } from "@/lib/composition-playground";
import { siteConfig } from "@/lib/site-config";
import { InspectorPanel } from "@/components/studio/inspector-panel";
import { StudioPanel } from "@/components/studio/studio-panel";
import { RemotionPreview } from "@/components/remotion-preview";
import { PerforationRule } from "@/components/studio/perforation-rule";

const BASE_PROPS = {
  audioSrc: DEMO_AUDIO_SRC,
  captions: DEMO_SOCIAL_CLIP_CAPTIONS,
  logoSrc: DEMO_LOGO_SRC,
  hookTitle: "Production-ready motion",
  hookSubtitle: "for Remotion. Source you own.",
  podcastTitle: siteConfig.name,
  ctaTitle: siteConfig.name,
  ctaLabel: "npx remotion-ui add",
  ctaUrl: "remotionui.com",
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
    <section className="border-b border-[var(--bay-border)] py-[120px]">
      <div className="mx-auto max-w-[1120px] px-6">
        <PerforationRule className="mb-16" />
        <div className="max-w-xl">
          <h2 className="text-display-lg">Tweak the clip</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            Drag props on a real composition. Watch the monitor update frame by
            frame.
          </p>
        </div>
        <div className="mt-12">
          <InspectorPanel
            fields={fields}
            usageSnippet={usageSnippet}
            preview={
              <StudioPanel
                label="social-clip"
                aspectRatio="9 / 16"
                fps={30}
                width={meta.previewWidth}
                height={meta.previewHeight}
                durationInFrames={meta.durationInFrames}
              >
                <RemotionPreview
                  component={
                    SocialClip as ComponentType<Record<string, unknown>>
                  }
                  durationInFrames={meta.durationInFrames}
                  width={meta.previewWidth}
                  height={meta.previewHeight}
                  inputProps={inputProps}
                />
              </StudioPanel>
            }
          />
        </div>
      </div>
    </section>
  );
}
