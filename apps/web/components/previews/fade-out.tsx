"use client";

import { FadeOut } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * No `delayInFrames`: the fade lands on the last frame of the window, and the
 * length alone decides when it starts. It is given the whole 96-frame window on
 * purpose. `EASING_EXIT` is cubic-in, so a short fade is *visually* a late
 * event however early it starts — at 22 frames the card sat untouched until
 * frame 74 and every sample before the last was the same still card. Spending
 * the whole window means the slow head of the curve is the hold, and no two
 * samples of the loop come back identical.
 */
export const FadeOutPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <FadeOut durationInFrames={96}>
      <ProductCard
        kicker={DEMO_COPY.endCard.ctaLabel}
        title={DEMO_COPY.productLaunch.title}
        detail="Holds, then leaves on the last frame"
      />
    </FadeOut>
  </PreviewFrame>
);
