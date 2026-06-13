"use client";

import { SpringIn } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const SpringInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <SpringIn durationInFrames={40}>
      <ProductCard
        kicker="Soft landing"
        title="Settle the reveal"
        detail="Spring motion without visual clutter"
      />
    </SpringIn>
  </PreviewFrame>
);
