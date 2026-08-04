"use client";

import { AbsoluteFill } from "remotion";
import { CaptionScene } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CaptionScenePreview: React.FC = () => (
  <ScenePreviewPlate direct style={{ background: "#111111" }}>
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1b1b1b 0%, #2b2721 45%, #0f0f0f 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        padding: 72,
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          width: 260,
          height: 148,
          borderRadius: 8,
          background: "rgba(245,244,242,0.10)",
          border: "1px solid rgba(245,244,242,0.16)",
        }}
      />
    </AbsoluteFill>
    <CaptionScene
      captions={DEMO_CAPTIONS}
      placement="lower-third"
      mode="highlight"
      backgroundColor="transparent"
      label="Source audio"
    />
  </ScenePreviewPlate>
);
