"use client";

import { SlideLeft } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const SlideLeftPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <SlideLeft>
      <ProductCard
        kicker="Lower panel"
        title="Guide attention"
        detail="Slides in from a stable layout slot"
      />
    </SlideLeft>
  </PreviewFrame>
);
