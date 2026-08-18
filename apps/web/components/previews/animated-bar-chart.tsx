"use client";

import { AnimatedBarChart } from "../registry-exports";
import { DEMO_BAR_DATA, DEMO_PALETTE } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The bars land well before half the 120-frame window, so without an exit the
 * back of the loop was a settled chart. `holdSeconds` is the corrected recipe
 * — `0.9 * window / fps - 0.79 * exitFor`, 3.6 - 0.33 — which puts the eased
 * midpoint of the retreat on the audit's 90% sample instead of ending before
 * it.
 */
export const AnimatedBarChartPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <AnimatedBarChart
      title="Views by format"
      subtitle="Last quarter, all channels"
      data={DEMO_BAR_DATA}
      highlightLabel="Shorts"
      accentColor={DEMO_PALETTE.phosphor}
      holdSeconds={3.27}
    />
  </ScenePreviewPlate>
);
