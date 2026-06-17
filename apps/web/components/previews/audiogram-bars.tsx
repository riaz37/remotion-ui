"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { AudiogramBars } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudiogramBarsPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <Audio src={DEMO_AUDIO_SRC} loop />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(232,184,109,0.14) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.09) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "56px 64px 88px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 860 }}>
          <AudiogramBars
            src={DEMO_AUDIO_SRC}
            height={160}
            barColor={DEMO_PALETTE.phosphor}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
