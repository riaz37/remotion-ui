"use client";

import { GrainGradientBg } from "../../registry/bases/default/primitives/grain-gradient-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * Shown under a card on purpose: the grain exists to stop a wide, shallow
 * gradient from banding, and banding is only judgeable against a flat panel
 * edge sitting on top of it.
 */
export const GrainGradientBgPreview: React.FC = () => (
  <PreviewFrame lane="shaders" padding={0}>
    <GrainGradientBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Anti-banding noise"
        title="Grain gradient"
        detail="Grain masks the banding in a wide, shallow gradient sweep."
      />
    </PreviewFrame>
  </PreviewFrame>
);
