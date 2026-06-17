"use client";

import { AbsoluteFill } from "remotion";
import { KaraokeCaptions } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { PreviewFrame } from "./preview-frame";

const [page] = groupCaptionsIntoPages(DEMO_CAPTIONS, 2200);

export const KaraokeCaptionsPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(232,184,109,0.14) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.10) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "48px 56px 124px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 860 }}>
          {page ? <KaraokeCaptions page={page} mode="scale" /> : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
