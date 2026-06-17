"use client";

import { MeshGradientBg } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";
import { DEMO_COPY } from "@/lib/demo-assets";

export const MeshGradientBgPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <MeshGradientBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Ambient layer"
        title="Mesh gradient"
        detail={DEMO_COPY.productLaunch.subtitle}
      />
    </PreviewFrame>
  </PreviewFrame>
);
