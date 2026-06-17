"use client";

import { FadeOut } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const FadeOutPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <FadeOut delayInFrames={60} durationInFrames={14}>
      <ProductCard
        kicker={DEMO_COPY.endCard.ctaLabel}
        title={DEMO_COPY.productLaunch.title}
        detail="Holds first, then fades away"
      />
    </FadeOut>
  </PreviewFrame>
);
