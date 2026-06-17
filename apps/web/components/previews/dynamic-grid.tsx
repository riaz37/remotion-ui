"use client";

import { DynamicGrid } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";
import { DEMO_COPY } from "@/lib/demo-assets";

export const DynamicGridPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <DynamicGrid />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Background"
        title="Dynamic grid"
        detail={DEMO_COPY.productLaunch.featureTitle}
      />
    </PreviewFrame>
  </PreviewFrame>
);
