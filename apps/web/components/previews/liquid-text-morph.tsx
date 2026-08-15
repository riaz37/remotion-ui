"use client";

import { LiquidTextMorph } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The 34-frame cycle (12 hold + 22 morph) is chosen so
 * the 90-frame gap between the first and last sample is not a whole number of
 * cycles: frame 18 is early in a melt, frame 60 is late in one, and frame 108
 * is a settled word — three different states, never the same phase twice.
 */
export const LiquidTextMorphPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <LiquidTextMorph
      words={["Melt", "Merge", "Reform"]}
      holdInFrames={12}
      morphInFrames={22}
      gooStrength={0.05}
      gooContrast={18}
      fontSize={132}
      color="#f4f4f5"
    />
  </PreviewFrame>
);
