"use client";

import { useMemo } from "react";
import { AbsoluteFill, Loop, useVideoConfig } from "remotion";
import { CaptionHighlight } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/** Caption span plus a beat of hold, so the loop never lands mid-word. */
const LOOP_SECONDS = 2.6;

export const CaptionHighlightPreview: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const tokens = usePreviewStage();
  const pages = useMemo(() => groupCaptionsIntoPages(DEMO_CAPTIONS, 2200), []);
  const page = pages[0];

  if (!page) return null;

  return (
    <PreviewFrame padding={0}>
      <Loop durationInFrames={Math.round(LOOP_SECONDS * fps)}>
        <AbsoluteFill
          style={{
            padding: "56px 72px",
            justifyContent: "center",
          }}
        >
          <CaptionHighlight
            page={page}
            activeColor={tokens.accent}
            inactiveColor={tokens.ink}
            fontSize={scaleFont(62, width)}
            textAlign="center"
          />
        </AbsoluteFill>
      </Loop>
    </PreviewFrame>
  );
};
