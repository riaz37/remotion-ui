"use client";

import { AbsoluteFill } from "remotion";
import { ReactionBurst } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Stand-in for the stream the reactions rise over. */
const StreamBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 70% 34%, rgba(244,114,182,0.16), transparent 36%), linear-gradient(135deg, #0d0a16 0%, #171425 54%, #070610 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "12%",
        top: "22%",
        width: "40%",
        height: "56%",
        borderRadius: 20,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.13), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    />
  </AbsoluteFill>
);

/**
 * The stream never settles, so every audit sample lands on different glyph
 * positions — no exit is needed here. Frames 18 / 60 / 108 each catch a
 * different set of reactions mid-climb.
 */
export const ReactionBurstPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <StreamBackdrop />
    <ReactionBurst align="right" ratePerSecond={7} />
  </PreviewFrame>
);
