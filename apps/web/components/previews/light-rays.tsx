"use client";

import { LightRays } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. Every shaft sways on its own period, and no two of
 * those periods share a beat, so the fan is in a different arrangement at all
 * three samples with no entrance to run out.
 *
 * A card sits on top because this is a stage layer, and a background that is
 * only ever shown empty tells you nothing about how it reads under type.
 */
export const LightRaysPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <LightRays originX={28} originY={-14} angle={20} spread={56} rayCount={11} />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Ambient layer"
        title="Light rays"
        detail={DEMO_COPY.creatorHook.subtitle}
      />
    </PreviewFrame>
  </PreviewFrame>
);
