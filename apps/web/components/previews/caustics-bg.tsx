"use client";

import { CausticsBg } from "../../registry/bases/default/primitives/caustics-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * The three interference layers traverse a wavelength in 72, 33 and 51 frames.
 * None of those is close to the audit's 42 and 48-frame sample gaps, and none
 * is a multiple of another, so the summed web is a different shape at frames
 * 18, 60 and 108 rather than the same web slid sideways.
 */
export const CausticsBgPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <CausticsBg scale={130} contrast={3.6} blur={9} intensity={1.15} />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Water refraction"
        title="Caustics"
        detail="Three interference layers overlap into a moving light web."
      />
    </PreviewFrame>
  </PreviewFrame>
);
