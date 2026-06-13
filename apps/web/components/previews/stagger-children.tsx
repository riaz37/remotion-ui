"use client";

import { FadeIn, StaggerChildren } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const StaggerChildrenPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        alignItems: "center",
      }}
    >
      <StaggerChildren staggerInFrames={12}>
        {["Hook", "Proof", "Action"].map((label) => (
          <FadeIn key={label} durationInFrames={20}>
            <div
              style={{
                color: "white",
                fontSize: 46,
                minWidth: 360,
                borderRadius: 24,
                padding: "18px 28px",
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              {label}
            </div>
          </FadeIn>
        ))}
      </StaggerChildren>
    </div>
  </PreviewFrame>
);
