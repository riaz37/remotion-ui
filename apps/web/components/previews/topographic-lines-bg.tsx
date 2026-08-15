"use client";

import { TopographicLinesBg } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * `speed={1.4}` puts one contour's travel from peak to rim at about 55 frames.
 * The audit's samples sit 42 and 48 frames apart, so at 55 they land on
 * distinct points of the rise; at the component's own 78-frame default two of
 * the three would catch the map in nearly the same state.
 */
export const TopographicLinesBgPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <TopographicLinesBg
      speed={1.4}
      lineWidth={1.7}
      lineCount={12}
      intensity={0.9}
      peaks={[
        { x: 20, y: 34, size: 72, roughness: 1.05 },
        { x: 84, y: 74, size: 54, roughness: 1.35 },
      ]}
    />
    <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
      <ProductCard
        kicker="Ambient layer"
        title="Topographic lines"
        detail={DEMO_COPY.creatorHook.subtitle}
      />
    </PreviewFrame>
  </PreviewFrame>
);
