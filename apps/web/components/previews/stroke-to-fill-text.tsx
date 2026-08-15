"use client";

import { StrokeToFillText } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The flood is deliberately slow: a 5-frame stagger
 * carries it across the line from frame 2 to frame 121, so all three samples
 * catch a different letter mid-fill. There is no exit here on purpose — the
 * entrance itself is still running at the last sample.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const StrokeToFillTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <StrokeToFillText
        text={DEMO_COPY.podcast.title}
        delayInFrames={2}
        staggerInFrames={5}
        durationInFrames={24}
        strokeWidth={2.5}
        strokeColor="#e8b86d"
        fillColor="#f4f4f5"
        direction="up"
        fontSize={72}
      />
    </div>
  </PreviewFrame>
);
