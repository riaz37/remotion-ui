"use client";

import { SpringIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

export const SpringInPreview: React.FC = () => (
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
      <SpringIn delayInFrames={6} durationInFrames={40}>
        <ProductCard
          kicker={DEMO_COPY.productLaunch.subtitle}
          title={DEMO_COPY.productLaunch.title}
          detail={DEMO_COPY.productLaunch.featureTitle}
        />
      </SpringIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
