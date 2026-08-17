"use client";

import { Intro } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";

export const IntroPreview: React.FC = () => (
  <Intro
    eyebrow="Chapter 01"
    title={DEMO_COPY.productLaunch.title}
    subtitle={DEMO_COPY.productLaunch.subtitle}
    topics={["Primitives", "Scenes", "Compositions"]}
  />
);
