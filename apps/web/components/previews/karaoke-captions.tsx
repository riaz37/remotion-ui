"use client";

import { AbsoluteFill, Loop, useVideoConfig } from "remotion";
import { KaraokeCaptions } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

const [page] = groupCaptionsIntoPages(DEMO_CAPTIONS, 2200);

/** Caption span plus a beat of hold — the preview outruns the demo timeline,
 * and without the loop the last third of it is a frozen finished line. */
const LOOP_SECONDS = 2.6;

export const KaraokeCaptionsPreview: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const tokens = usePreviewStage();

  if (!page) return null;

  return (
    <PreviewFrame padding={0}>
      <Loop durationInFrames={Math.round(LOOP_SECONDS * fps)}>
        <AbsoluteFill
          style={{
            padding: "56px 64px",
            justifyContent: "center",
          }}
        >
          <KaraokeCaptions
            page={page}
            mode="underline"
            activeColor={tokens.accent}
            completedColor={tokens.ink}
            inactiveColor={tokens.muted}
            trackColor={tokens.panelBorder}
            fontSize={scaleFont(62, width)}
          />
        </AbsoluteFill>
      </Loop>
    </PreviewFrame>
  );
};
