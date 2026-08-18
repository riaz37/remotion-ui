"use client";

import { QuoteCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * `holdSeconds` follows the measured recipe for the cubic exit easing:
 * 0.9 * 113 / 30 - 0.79 * 0.4 = 3.07, which lands the 90% sample mid-exit.
 */
export const QuoteCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <QuoteCard
      quote={DEMO_COPY.quote.text}
      emphasis="motion"
      author={DEMO_COPY.quote.attribution}
      role="Head of Video, Northwind"
      holdSeconds={3.07}
    />
  </ScenePreviewPlate>
);
