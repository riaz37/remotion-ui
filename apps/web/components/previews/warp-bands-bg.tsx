"use client";

import { WarpBandsBg } from "../../registry/bases/default/primitives/warp-bands-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * The swirl has no entrance and no loop point, so the audit's 15/50/90% samples
 * land on three different arrangements of the same field with nothing to run
 * out of.
 */
export const WarpBandsBgPreview: React.FC = () => (
  <PreviewFrame lane="shaders" padding={0}>
    <WarpBandsBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Warping bands"
        title="Warp bands"
        detail="Bands swirl continuously with no entrance and no loop point."
      />
    </PreviewFrame>
  </PreviewFrame>
);
