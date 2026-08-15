"use client";

import { QuoteCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const QuoteCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <QuoteCard
      quote={DEMO_COPY.quote.text}
      emphasis="motion"
      author={DEMO_COPY.quote.attribution}
      role="Head of Video, Northwind"
      holdSeconds={3.2}
    />
  </ScenePreviewPlate>
);
