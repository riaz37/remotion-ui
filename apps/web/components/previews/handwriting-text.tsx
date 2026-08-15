"use client";

import { HandwritingText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

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
