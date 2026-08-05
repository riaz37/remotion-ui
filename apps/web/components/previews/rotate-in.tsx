"use client";

import { RotateIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.featureTitle}
    title={DEMO_COPY.productLaunch.featureItems[0]}
    detail={DEMO_COPY.productLaunch.featureItems[1]}
  />
);

export const RotateInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<Card />}>
      <RotateIn
        delayInFrames={6}
        durationInFrames={32}
        axis="x"
        degrees={-24}
        origin="bottom"
        exit
      >
        <Card />
      </RotateIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
