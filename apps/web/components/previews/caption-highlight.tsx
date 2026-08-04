"use client";

import { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CaptionHighlight } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export const CaptionHighlightPreview: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const pages = useMemo(() => groupCaptionsIntoPages(DEMO_CAPTIONS), []);
  const page = pages[0];
  const safeArea = getSafeAreaPadding({ width, height });

  if (!page) return null;

  const startFrame = Math.round((page.startMs / 1000) * fps);
  const durationInFrames = Math.round((page.durationMs / 1000) * fps);

  return (
    <AbsoluteFill style={{ background: "#f5f4f2" }}>
      <AbsoluteFill
        style={{
          padding: `${safeArea.paddingTop}px ${safeArea.paddingRight}px ${safeArea.paddingBottom}px ${safeArea.paddingLeft}px`,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 780,
            display: "grid",
            gap: scaleFont(18, width),
          }}
        >
          <div
            style={{
              width: scaleFont(56, width),
              height: scaleFont(4, width),
              background: "#ff6b00",
            }}
          />
          <Sequence from={startFrame} durationInFrames={durationInFrames} layout="none">
            <CaptionHighlight
              page={page}
              activeColor="#ff6b00"
              inactiveColor="#111111"
              fontSize={scaleFont(68, width)}
              textAlign="left"
            />
          </Sequence>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
