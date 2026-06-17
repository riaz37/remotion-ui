"use client";

import { Sequence } from "remotion";
import { ConfettiBurst } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";
import { DEMO_COPY } from "@/lib/demo-assets";

export const ConfettiBurstPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <ProductCard
      kicker="Celebrate"
      title={DEMO_COPY.creatorHook.headline}
      detail={DEMO_COPY.creatorHook.subtitle}
    />
    <Sequence from={8} layout="none">
      <ConfettiBurst originX={50} originY={36} seed="docs-confetti" />
    </Sequence>
  </PreviewFrame>
);
