"use client";

import { BlurIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

export const BlurInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack
      ghost={
        <ProductCard
          kicker={DEMO_COPY.productLaunch.subtitle}
          title={DEMO_COPY.productLaunch.title}
          detail={DEMO_COPY.productLaunch.featureTitle}
        />
      }
    >
      <BlurIn delayInFrames={6} durationInFrames={30}>
        <ProductCard
          kicker={DEMO_COPY.productLaunch.subtitle}
          title={DEMO_COPY.productLaunch.title}
          detail={DEMO_COPY.productLaunch.featureTitle}
        />
      </BlurIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
