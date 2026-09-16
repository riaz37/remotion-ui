"use client";

import { Showcase } from "../../registry/bases/default/compositions/showcase";
import { DEMO_COPY } from "@/lib/demo-assets";

export const ShowcasePreview: React.FC = () => (
  <Showcase
    title={DEMO_COPY.productLaunch.title}
    subtitle={DEMO_COPY.productLaunch.subtitle}
    featureTitle={DEMO_COPY.showcaseFeatures.title}
    featureItems={[...DEMO_COPY.showcaseFeatures.items]}
    statValue={DEMO_COPY.dataStory.statValue}
    statLabel={DEMO_COPY.dataStory.statLabel}
    ctaLabel={DEMO_COPY.endCard.ctaLabel}
    ctaUrl={DEMO_COPY.endCard.ctaUrl}
  />
);
