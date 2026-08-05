"use client";

import { FadeOut } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/** No `delayInFrames`: the fade lands on the last frame of the window. */
export const FadeOutPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <FadeOut durationInFrames={22}>
      <ProductCard
        kicker={DEMO_COPY.endCard.ctaLabel}
        title={DEMO_COPY.productLaunch.title}
        detail="Holds, then leaves on the last frame"
      />
    </FadeOut>
  </PreviewFrame>
);
