"use client";

import { MarkerHighlight } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

export const MarkerHighlightPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={72}>
      <div
        style={{
          display: "grid",
          gap: 26,
          justifyItems: "center",
          width: 660,
          padding: "48px 52px",
          borderRadius: 8,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <PreviewKicker>{DEMO_COPY.quote.attribution}</PreviewKicker>
        <MarkerHighlight
          text={DEMO_COPY.quote.text}
          phrase="code you can read and change"
          delayInFrames={12}
          durationInFrames={11}
          staggerInFrames={4}
          fontSize={46}
          textAlign="center"
          color={tokens.ink}
          markerColor={DEMO_PALETTE.phosphor}
        />
      </div>
    </PreviewFrame>
  );
};
