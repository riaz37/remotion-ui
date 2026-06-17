"use client";

import { Showcase } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";

export const ShowcasePreview: React.FC = () => (
  <Showcase
    title={DEMO_COPY.productLaunch.title}
    subtitle={DEMO_COPY.productLaunch.subtitle}
    featureTitle={DEMO_COPY.productLaunch.featureTitle}
    statValue={DEMO_COPY.dataStory.statValue}
    statLabel={DEMO_COPY.dataStory.statLabel}
    ctaLabel={DEMO_COPY.endCard.ctaLabel}
    ctaUrl={DEMO_COPY.endCard.ctaUrl}
  />
);
