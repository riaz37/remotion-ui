"use client";

import { LightTunnelBg } from "../../registry/bases/default/primitives/light-tunnel-bg";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * A card sits on top for the same reason the dither preview carries one: this
 * is a stage layer, and a tunnel shown empty says nothing about whether type
 * survives over a field that is brightest exactly where a title would sit.
 */
export const LightTunnelBgPreview: React.FC = () => (
  <PreviewFrame lane="shaders" padding={0}>
    <LightTunnelBg />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Radial tunnel"
        title="Light tunnel"
        detail="A bright core recedes down an endless tunnel of light."
      />
    </PreviewFrame>
  </PreviewFrame>
);
