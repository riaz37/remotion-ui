"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { VariableFontMorph } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * A real variable face, not the fallback path.
 *
 * `font-variation-settings` is inert on a static family, so on the default
 * system stack this preview was only ever showing the component's `font-weight`
 * fallback — a two-step snap between whatever discrete weights the system font
 * ships, not the `200 → 900` glide the component is named for. Google serves
 * Inter as a single variable woff2 (all nine weight URLs are the same file), so
 * loading it here at module scope gives the `wght` axis somewhere continuous to
 * travel.
 */
const { fontFamily } = loadFont("normal", {
  weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

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
  <PreviewFrame lane="atoms" padding={56}>
    <div style={stage}>
      {/* Two lines at 108px instead of one at 78px: a single short line left
          the bottom half of the stage empty and the type unreadable at a 308px
          tile. */}
      <VariableFontMorph
        text={"Weight in\nmotion"}
        fontFamily={fontFamily}
        weight={[200, 900]}
        oscillate
        periodInFrames={34}
        phaseStep={0.5}
        delayInFrames={2}
        staggerInFrames={2}
        durationInFrames={22}
        fontSize={108}
      />
    </div>
  </PreviewFrame>
);
