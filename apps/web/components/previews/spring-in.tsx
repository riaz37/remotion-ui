"use client";

import { SpringIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.subtitle}
    title={DEMO_COPY.productLaunch.title}
    detail={DEMO_COPY.productLaunch.featureTitle}
  />
);

export const SpringInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<Card />}>
      <SpringIn
        delayInFrames={6}
        durationInFrames={40}
        config="bouncy"
        travel={26}
        exit
      >
        <Card />
      </SpringIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
