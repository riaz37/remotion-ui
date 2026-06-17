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
  const bottomSlot = Math.max(safeArea.paddingBottom, Math.round(height * 0.12));

  if (!page) return null;

  const startFrame = Math.round((page.startMs / 1000) * fps);
  const durationInFrames = Math.round((page.durationMs / 1000) * fps);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(232,184,109,0.14) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.10) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          background:
            "linear-gradient(to top, rgba(8,10,16,0.88) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <Sequence from={startFrame} durationInFrames={durationInFrames} layout="none">
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: safeArea.paddingLeft,
              right: safeArea.paddingRight,
              bottom: bottomSlot,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: width - safeArea.paddingLeft - safeArea.paddingRight,
                padding: `${scaleFont(12, width)}px ${scaleFont(20, width)}px`,
                borderRadius: scaleFont(12, width),
                background: "rgba(8,10,16,0.58)",
                textAlign: "center",
              }}
            >
              <CaptionHighlight page={page} activeScale={1.08} fontSize={48} />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
