"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { LineChartDraw } from "../registry-exports";
import { DEMO_LINE_POINTS, DEMO_PALETTE } from "@/lib/demo-assets";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";

/**
 * The primitive draws at an explicit size, so the wrapper hands it the real
 * slot width rather than a fixed number that only fits one composition size.
 */
export const LineChartDrawPreview: React.FC = () => {
  const { width, height } = useVideoConfig();
  const contentWidth = width - 128;

  return (
    <PreviewFrame lane="vectors" padding={0}>
      <AbsoluteFill>
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
          <div
            style={{ width: "100%", display: "grid", gap: scaleFont(30, width) }}
          >
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
                Monthly reach
              </div>
              <div
                style={{
                  color: "rgba(250,250,250,0.52)",
                  fontSize: scaleFont(22, width),
                  fontWeight: 650,
                  lineHeight: 1,
                }}
              >
                Jan – Jun
              </div>
            </div>

            <LineChartDraw
              points={DEMO_LINE_POINTS}
              // Longer than the 60-frame window on purpose — see the note in
              // `preview-config`. The expo-out curve spends its visible motion
              // in the first ~40% of the stated duration, so 110 frames is what
              // keeps the line drawing until roughly 75% of the loop.
              durationInFrames={110}
              width={contentWidth}
              height={Math.round(height * 0.46)}
              color={DEMO_PALETTE.phosphor}
              showEndLabel
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </PreviewFrame>
  );
};
