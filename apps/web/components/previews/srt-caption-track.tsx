"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { SrtCaptionTrack } from "../registry-exports";
import { DEMO_SRT_SRC } from "@/lib/demo-assets";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * Loads the real `.srt` over `staticFile()` rather than passing an inline
 * string, so the audit render exercises the fetch-behind-`delayRender()` path.
 * A loader that silently never resolves would otherwise pass this preview and
 * fail on somebody's actual transcript.
 */
export const SrtCaptionTrackPreview: React.FC = () => {
  const { width } = useVideoConfig();
  const tokens = usePreviewStage();

  return (
    <PreviewFrame padding={0}>
      <AbsoluteFill style={{ padding: "56px 72px", justifyContent: "center" }}>
        <SrtCaptionTrack
          src={DEMO_SRT_SRC}
          activeColor={tokens.accent}
          inactiveColor={tokens.ink}
          fontSize={scaleFont(58, width)}
          textAlign="center"
        />
      </AbsoluteFill>
    </PreviewFrame>
  );
};
