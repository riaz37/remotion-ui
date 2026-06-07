"use client";

import { AbsoluteFill } from "remotion";
import { FadeIn, StaggerChildren } from "../registry-exports";

export const StaggerChildrenPreview: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0f172a",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
      }}
    >
      <StaggerChildren staggerInFrames={12}>
        {["First", "Second", "Third"].map((label) => (
          <FadeIn key={label} durationInFrames={20}>
            <div
              style={{
                color: "white",
                fontSize: 36,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
              }}
            >
              {label}
            </div>
          </FadeIn>
        ))}
      </StaggerChildren>
    </div>
  </AbsoluteFill>
);
