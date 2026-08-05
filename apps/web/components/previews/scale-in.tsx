"use client";

import { ScaleIn } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack, ProductCard } from "./preview-frame";

const Card: React.FC = () => (
  <ProductCard
    kicker={DEMO_COPY.productLaunch.subtitle}
    title={DEMO_COPY.productLaunch.title}
    detail={DEMO_COPY.productLaunch.featureTitle}
  />
);

export const ScaleInPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <PreviewGhostStack ghost={<Card />}>
      <ScaleIn delayInFrames={6} durationInFrames={30} from={0.9} exit>
        <Card />
      </ScaleIn>
    </PreviewGhostStack>
  </PreviewFrame>
);
