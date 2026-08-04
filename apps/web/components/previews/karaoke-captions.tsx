"use client";

import { AbsoluteFill } from "remotion";
import { KaraokeCaptions } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { PreviewFrame } from "./preview-frame";

const [page] = groupCaptionsIntoPages(DEMO_CAPTIONS, 2200);

export const KaraokeCaptionsPreview: React.FC = () => (
  <PreviewFrame backgroundColor="#f5f4f2" padding={0}>
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "56px 48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 960 }}>
          {page ? (
            <KaraokeCaptions
              page={page}
              mode="underline"
              activeColor="#ff6b00"
              completedColor="#111111"
              inactiveColor="rgba(17,17,17,0.28)"
              fontSize={64}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
