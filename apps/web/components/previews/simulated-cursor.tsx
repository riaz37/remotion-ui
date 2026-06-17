"use client";

import { Sequence } from "remotion";
import { SimulatedCursor } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";
import { DEMO_COPY } from "@/lib/demo-assets";

export const SimulatedCursorPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <ProductCard
      kicker="Tutorial"
      title={DEMO_COPY.productLaunch.featureTitle}
      detail="Follow the guided cursor"
    />
    <Sequence from={0} layout="none">
      <SimulatedCursor
        points={[
          { x: 22, y: 68, frame: 0 },
          { x: 48, y: 52, frame: 22 },
          { x: 72, y: 38, frame: 44 },
        ]}
        clickFrames={[44]}
      />
    </Sequence>
  </PreviewFrame>
);
