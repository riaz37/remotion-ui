"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { AudioPulse } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudioPulsePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <Audio src={DEMO_AUDIO_SRC} loop />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(232,184,109,0.16) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.10) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 64,
        }}
      >
        <AudioPulse
          src={DEMO_AUDIO_SRC}
          size={252}
          color={DEMO_PALETTE.phosphor}
          ringCount={4}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
