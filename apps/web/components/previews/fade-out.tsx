"use client";

import { FadeOut } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const FadeOutPreview: React.FC = () => (
  <PreviewFrame>
    <FadeOut delayInFrames={36} durationInFrames={20}>
      <div
        style={{
          width: 460,
          borderRadius: 26,
          padding: "38px 42px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 24px 80px rgba(59,130,246,0.22)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#93c5fd", fontSize: 24, fontWeight: 800 }}>
          Exit state
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 58,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          Fade out
        </div>
      </div>
    </FadeOut>
  </PreviewFrame>
);
