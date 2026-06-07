"use client";

import { AbsoluteFill } from "remotion";
import { Typewriter } from "../registry-exports";

export const TypewriterPreview: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#0f172a",
      justifyContent: "center",
      alignItems: "center",
      padding: 48,
    }}
  >
    <Typewriter
      text="From prompt to motion graphics. This is RemotionUI."
      pauseAfter="From prompt to motion graphics."
      charFrames={2}
      pauseSeconds={0.8}
    />
  </AbsoluteFill>
);
