"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { AudioReactiveScale } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * The wrapper draws nothing of its own, so the preview supplies the subject.
 * A plate with type in it is the honest demo: it shows that an arbitrary child
 * — not a bespoke shape — is what reacts.
 */
export const AudioReactiveScalePreview: React.FC = () => (
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
          justifyContent: "center",
          alignItems: "center",
          padding: 64,
        }}
      >
        <AudioReactiveScale
          src={DEMO_AUDIO_SRC}
          minScale={0.84}
          maxScale={1.2}
          tilt={1.4}
          minOpacity={0.7}
        >
          <div
            style={{
              width: 540,
              padding: "44px 52px",
              borderRadius: 10,
              background: "rgba(12,12,20,0.86)",
              border: `1px solid ${DEMO_PALETTE.phosphor}55`,
              boxShadow: `0 0 60px ${DEMO_PALETTE.phosphor}22`,
              textAlign: "center",
              display: "grid",
              gap: 14,
            }}
          >
            <div
              style={{
                color: DEMO_PALETTE.phosphor,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              On the beat
            </div>
            <div
              style={{
                color: DEMO_PALETTE.text,
                fontSize: 52,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Wrap anything
            </div>
          </div>
        </AudioReactiveScale>
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
