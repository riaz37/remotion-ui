"use client";

import { ScaleIn } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const ScaleInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <ScaleIn>
      <ProductCard
        kicker="Focal pop"
        title="Make the card land"
        detail="A controlled scale entrance"
      />
    </ScaleIn>
  </PreviewFrame>
);
