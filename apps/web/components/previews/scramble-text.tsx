"use client";

import { ScrambleText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. `order="center"` halves the effective stagger depth —
 * the outermost character ranks 8, not 16 — so the stagger is 6 frames to keep
 * noise on the ends until frame ~76 and both of the first two samples
 * mid-resolve. The exit re-scrambles from frame 96 for the third — earlier than
 * that and opacity, which is gone 70% of the way through an exit, empties the
 * frame before the sample lands.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const ScrambleTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <ScrambleText
        text="Resolve out of noise"
        order="center"
        charset="symbols"
        tickInFrames={2}
        delayInFrames={2}
        staggerInFrames={6}
        durationInFrames={26}
        exitAtInFrames={96}
        exitInFrames={24}
        exitStaggerInFrames={1}
        scrambleColor="#e8b86d"
        fontSize={62}
      />
    </div>
  </PreviewFrame>
);
