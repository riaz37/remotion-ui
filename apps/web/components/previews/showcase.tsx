"use client";

import { Sequence } from "remotion";
import { Showcase } from "../registry-exports";

export const ShowcasePreview: React.FC = () => (
  <Sequence from={-70}>
    <Showcase
      title="Product story"
      subtitle="Install source, compose scenes, render on your timeline"
      featureTitle="Three layers you own"
      statValue={0}
      statLabel="Runtime dependencies"
      ctaLabel="npx remotion-ui add"
      ctaUrl="remotionui.com"
    />
  </Sequence>
);
