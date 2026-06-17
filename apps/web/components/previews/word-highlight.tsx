"use client";

import { WordHighlight } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";

export const WordHighlightPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div
      style={{
        display: "grid",
        gap: 22,
        justifyItems: "center",
        width: 640,
        padding: "48px 52px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
      }}
    >
      <PreviewKicker>{DEMO_COPY.quote.attribution}</PreviewKicker>
      <WordHighlight
        text={DEMO_COPY.quote.text}
        highlightWord="change"
        delayInFrames={10}
        durationInFrames={45}
        highlightColor={DEMO_PALETTE.phosphor}
      />
    </div>
  </PreviewFrame>
);
