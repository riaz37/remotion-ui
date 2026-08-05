"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { WaveformLine } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_PALETTE } from "@/lib/demo-assets";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";

export const WaveformLinePreview: React.FC = () => {
  const { width, height } = useVideoConfig();
  const contentWidth = width - 128;

  return (
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
            padding: "56px 64px",
            justifyContent: "center",
            color: DEMO_PALETTE.text,
          }}
        >
          <div style={{ width: "100%", display: "grid", gap: scaleFont(28, width) }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: scaleFont(24, width),
              }}
            >
              <div
                style={{
                  fontSize: scaleFont(44, width),
                  fontWeight: 760,
                  lineHeight: 1,
                }}
              >
                Voice note
              </div>
              <div
                style={{
                  color: "rgba(250,250,250,0.52)",
                  fontSize: scaleFont(22, width),
                  fontWeight: 650,
                  lineHeight: 1,
                }}
              >
                00:18
              </div>
            </div>

            <div
              style={{
                width: "100%",
                borderTop: "1px solid rgba(250,250,250,0.12)",
                borderBottom: "1px solid rgba(250,250,250,0.12)",
                padding: `${scaleFont(34, width)}px 0`,
              }}
            >
              <WaveformLine
                src={DEMO_AUDIO_SRC}
                width={contentWidth}
                height={Math.round(height * 0.24)}
                strokeColor={DEMO_PALETTE.phosphor}
                mutedStrokeColor="rgba(250,250,250,0.16)"
                baselineColor="rgba(250,250,250,0.12)"
                strokeWidth={Math.max(3, scaleFont(4, width))}
              />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </PreviewFrame>
  );
};
