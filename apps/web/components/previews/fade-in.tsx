"use client";

import { FadeIn } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const FadeInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <FadeIn>
      <ProductCard
        kicker="Launch beat"
        title="Reveal the offer"
        detail="Pure opacity, no layout shift"
      />
    </FadeIn>
  </PreviewFrame>
);
