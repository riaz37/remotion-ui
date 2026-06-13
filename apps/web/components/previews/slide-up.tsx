"use client";

import { Sequence } from "remotion";
import { SlideUp } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const SlideUpPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <Sequence from={-20} layout="none">
      <SlideUp>
        <ProductCard
          kicker="Hero entrance"
          title="Ship the update"
          detail="Rises into its reserved slot"
        />
      </SlideUp>
    </Sequence>
  </PreviewFrame>
);
