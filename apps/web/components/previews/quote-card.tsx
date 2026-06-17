"use client";

import { QuoteCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const QuoteCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <QuoteCard
      quote={DEMO_COPY.quote.text}
      highlightWord="motion"
      author={DEMO_COPY.quote.attribution}
    />
  </ScenePreviewPlate>
);
