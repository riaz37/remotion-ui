"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { WaveformLine } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export const WaveformLinePreview: React.FC = () => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill style={{ background: "#f5f4f2", color: "#111111" }}>
      <AbsoluteFill
        style={{
          padding: `${safeArea.paddingTop}px ${safeArea.paddingRight}px ${safeArea.paddingBottom}px ${safeArea.paddingLeft}px`,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: scaleFont(28, width),
          }}
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
                display: "grid",
                gap: scaleFont(8, width),
              }}
            >
              <div
                style={{
                  width: scaleFont(52, width),
                  height: Math.max(3, scaleFont(4, width)),
                  background: "#ff6b00",
                }}
              />
              <div
                style={{
                  fontSize: scaleFont(44, width),
                  fontWeight: 760,
                  letterSpacing: 0,
                  lineHeight: 1,
                }}
              >
                Voice note
              </div>
            </div>
            <div
              style={{
                color: "rgba(17,17,17,0.46)",
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
              borderTop: "1px solid rgba(17,17,17,0.14)",
              borderBottom: "1px solid rgba(17,17,17,0.14)",
              padding: `${scaleFont(34, width)}px 0`,
            }}
          >
            <WaveformLine
              src={DEMO_AUDIO_SRC}
              width={width - safeArea.paddingLeft - safeArea.paddingRight}
              height={Math.round(height * 0.24)}
              strokeColor="#ff6b00"
              mutedStrokeColor="rgba(17,17,17,0.16)"
              baselineColor="rgba(17,17,17,0.12)"
              strokeWidth={Math.max(3, scaleFont(4, width))}
              amplitudeScale={0.52}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
