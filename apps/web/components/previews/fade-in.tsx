"use client";

import { FadeIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

export const FadeInPreview: React.FC = () => (
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
        <FadeIn delayInFrames={6} durationInFrames={22}>
          <ProductCard
            kicker={DEMO_COPY.productLaunch.subtitle}
            title={DEMO_COPY.productLaunch.title}
            detail={DEMO_COPY.productLaunch.featureTitle}
          />
        </FadeIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
