"use client";

import { SkewIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The lean runs frames 4–44 so it is mid-travel at the
 * first sample and upright at the second. The exit starts at 96, not earlier:
 * opacity is gone 70% of the way through an exit, so an exit at 88 left frame
 * 108 completely blank — it passed the PSNR check and looked like a dead
 * preview. See docs-internal/preview-audit-rubric.md.
 */
export const SkewInPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <SkewIn
      delayInFrames={4}
      durationInFrames={40}
      exitAtInFrames={96}
      exitInFrames={26}
      skew={16}
      travel={72}
    >
      <ProductCard
        kicker="Editorial entrance"
        title="Leans in, straightens up"
        detail={DEMO_COPY.productLaunch.subtitle}
      />
    </SkewIn>
  </PreviewFrame>
);
