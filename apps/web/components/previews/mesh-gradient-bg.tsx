"use client";

import { MeshGradientBg } from "../../registry/bases/default/primitives/mesh-gradient-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

export const MeshGradientBgPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <MeshGradientBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Mesh blend"
        title="Mesh gradient"
        detail="Soft colour fields blend and drift across a mesh grid."
      />
    </PreviewFrame>
  </PreviewFrame>
);
