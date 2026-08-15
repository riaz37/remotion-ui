"use client";

import { AbsoluteFill } from "remotion";
import { VoiceNoteBubble } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The playhead crosses the bar over the full 120-frame window, so the coloured
 * boundary is in a different place at every audit sample and there is no tail
 * to freeze.
 */
export const VoiceNoteBubblePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "0 72px",
        gap: 28,
      }}
    >
      <VoiceNoteBubble
        durationInFrames={120}
        sender="Sam"
        avatar="S"
        barCount={44}
        width={560}
        barHeight={48}
      />
      <VoiceNoteBubble
        durationInFrames={120}
        delayInFrames={26}
        seed={7}
        align="right"
        barCount={32}
        width={420}
        barHeight={40}
        playedColor="#2dd4bf"
        showTime={false}
      />
    </AbsoluteFill>
  </PreviewFrame>
);
