"use client";

import { RotateIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

export const RotateInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack
      ghost={
        <ProductCard
          kicker={DEMO_COPY.productLaunch.featureTitle}
          title={DEMO_COPY.productLaunch.featureItems[0]}
          detail={DEMO_COPY.productLaunch.featureItems[1]}
        />
      }
    >
      <RotateIn delayInFrames={6} durationInFrames={30} degrees={-15}>
        <ProductCard
          kicker={DEMO_COPY.productLaunch.featureTitle}
          title={DEMO_COPY.productLaunch.featureItems[0]}
          detail={DEMO_COPY.productLaunch.featureItems[1]}
        />
      </RotateIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
