"use client";

import { RotateIn } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const RotateInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <RotateIn durationInFrames={30} degrees={-15}>
      <ProductCard
        kicker="Accent motion"
        title="Tilt into focus"
        detail="Small rotation, big emphasis"
      />
    </RotateIn>
  </PreviewFrame>
);
