"use client";

import { VariableFontMorph } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. `oscillate` keeps the weight wave travelling for the
 * whole window. The period is 34 frames, not the 46 it started at: the samples
 * are 42 and 48 frames apart, so a 46-frame period put frames 60 and 108 back
 * on almost exactly the same phase and the two stills were visually the same
 * picture. Check the period against the sample gaps, not just against the
 * window.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const VariableFontMorphPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <VariableFontMorph
        text="Weight in motion"
        weight={[200, 900]}
        oscillate
        periodInFrames={34}
        phaseStep={0.5}
        delayInFrames={2}
        staggerInFrames={2}
        durationInFrames={22}
        fontSize={78}
      />
    </div>
  </PreviewFrame>
);
