"use client";

import { ScaleIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

export const ScaleInPreview: React.FC = () => (
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
      <ScaleIn delayInFrames={6} durationInFrames={30}>
        <ProductCard
          kicker={DEMO_COPY.productLaunch.subtitle}
          title={DEMO_COPY.productLaunch.title}
          detail={DEMO_COPY.productLaunch.featureTitle}
        />
      </ScaleIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
