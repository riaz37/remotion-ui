"use client";

import { loadFont } from "@remotion/google-fonts/Caveat";
import { HandwritingText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * A real script face, not the generic `cursive` fallback.
 *
 * The component is deliberately font-agnostic — no primitive in the catalog
 * loads a font, because doing so would force a `@remotion/google-fonts`
 * dependency on everyone who copies one file. So its default family is a
 * system script *stack*, and what that resolves to depends on the render
 * machine: a signature on macOS, an ordinary sans on a Linux render farm.
 * Loading Caveat here at module scope makes the demo deterministic and makes
 * it actually look handwritten wherever it renders.
 */
const { fontFamily } = loadFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. A 9-frame stagger writes the line across frames 2–115
 * — roughly the pace a hand actually signs at — so the nib is still travelling
 * at all three samples. There is no exit: a staggered fade left half a word on
 * screen at the last sample, which reads as clipped type rather than as ink.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const HandwritingTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <HandwritingText
        text="Signed by hand"
        fontFamily={fontFamily}
        delayInFrames={2}
        staggerInFrames={9}
        durationInFrames={14}
        penSize={0.16}
        penColor="#e8b86d"
        fontSize={78}
      />
    </div>
  </PreviewFrame>
);
