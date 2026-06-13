"use client";

import { BlurIn } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const BlurInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <BlurIn>
      <ProductCard
        kicker="Focus shift"
        title="Bring the message in"
        detail="Soft blur resolves to crisp type"
      />
    </BlurIn>
  </PreviewFrame>
);
