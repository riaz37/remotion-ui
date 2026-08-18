"use client";

import { StatCard } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

// A four-figure value against a `max`, so the roll has enough states to be
// caught mid-count by a sampled still and the ring reads as the meter its
// props describe rather than a decorative full sweep.
export const StatCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <StatCard
      value={1284}
      max={1500}
      suffix=""
      label="Renders this week"
      caption="Target 1,500 · resets Monday"
      delta={12}
      holdSeconds={3.37}
    />
  </ScenePreviewPlate>
);
