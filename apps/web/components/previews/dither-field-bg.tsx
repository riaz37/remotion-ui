"use client";

import { DitherFieldBg } from "../../registry/bases/default/primitives/dither-field-bg";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * A card sits on top because this is a stage layer, and a dither field shown
 * empty tells you nothing about whether type survives on it: the quantised
 * grid is the one background in the lane that can fight small text.
 */
export const DitherFieldBgPreview: React.FC = () => (
  <PreviewFrame lane="shaders" padding={0}>
    <DitherFieldBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Ambient layer"
        title="Dither field"
        detail={DEMO_COPY.productLaunch.subtitle}
      />
    </PreviewFrame>
  </PreviewFrame>
);
