"use client";

import { Typewriter } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";

const typewriterText = `${DEMO_COPY.tutorial.calloutTitle}.[pause:0.5] ${DEMO_COPY.tutorial.calloutSubtitle}`;

export const TypewriterPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={{ display: "grid", gap: 24, justifyItems: "center", width: "100%", maxWidth: 780 }}>
      <PreviewKicker>{DEMO_COPY.productLaunch.featureTitle}</PreviewKicker>
      <Typewriter
        text={typewriterText}
        delayInFrames={8}
        charFrames={3}
        pauseSeconds={0.8}
        humanize
        respectPunctuation
        cursorStyle="block"
        style={{ fontSize: 58, textAlign: "center" }}
      />
    </div>
  </PreviewFrame>
);
