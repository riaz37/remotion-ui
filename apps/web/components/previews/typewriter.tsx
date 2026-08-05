"use client";

import { Typewriter } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

const typewriterText = `${DEMO_COPY.tutorial.calloutTitle}.[pause:0.5] ${DEMO_COPY.tutorial.calloutSubtitle}`;

export const TypewriterPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={72}>
      <div
        style={{
          display: "grid",
          gap: 24,
          justifyItems: "center",
          width: "100%",
          maxWidth: 780,
        }}
      >
        <PreviewKicker>{DEMO_COPY.productLaunch.featureTitle}</PreviewKicker>
        <Typewriter
          text={typewriterText}
          delayInFrames={8}
          charFrames={2.4}
          pauseSeconds={0.8}
          humanize
          respectPunctuation
          cursorStyle="block"
          color={tokens.ink}
          style={{ fontSize: 56, textAlign: "center" }}
        />
      </div>
    </PreviewFrame>
  );
};
