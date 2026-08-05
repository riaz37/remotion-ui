"use client";

import { BlurIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.subtitle}
    title={DEMO_COPY.productLaunch.title}
    detail={DEMO_COPY.productLaunch.featureTitle}
  />
);

export const BlurInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<Card />}>
      <BlurIn delayInFrames={6} durationInFrames={30} maxBlur={14} exit>
        <Card />
      </BlurIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
