"use client";

import { Sequence } from "remotion";
import { Showcase } from "../registry-exports";

export const ShowcasePreview: React.FC = () => (
  <Sequence from={-70}>
    <Showcase title="Launch Kit" subtitle="Scenes for product stories" />
  </Sequence>
);
