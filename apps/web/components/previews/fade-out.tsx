"use client";

import { FadeOut } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const FadeOutPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <FadeOut delayInFrames={70} durationInFrames={10}>
      <ProductCard
        kicker="Exit beat"
        title="Clear the frame"
        detail="Holds first, then fades away"
      />
    </FadeOut>
  </PreviewFrame>
);
