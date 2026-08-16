"use client";

import { AbsoluteFill } from "remotion";
import { SvgMaskReveal } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/** Stand-in for whatever the mask is opening onto. */
const Revealed: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 30% 26%, rgba(232,184,109,0.55), transparent 46%), linear-gradient(140deg, #1b1408 0%, #2a1f10 46%, #0b0a08 100%)",
      alignItems: "center",
      justifyContent: "center",
      color: "#F3E7D2",
      fontFamily: "system-ui, sans-serif",
      fontSize: 64,
      fontWeight: 700,
      letterSpacing: "-0.03em",
    }}
  >
    Ship it
  </AbsoluteFill>
);

/**
 * The squircle opens over frames 6–96 from the upper left, so frames 18 and 60
 * catch it part way across and frame 108 lands just after it clears the corner.
 * See docs-internal/preview-audit-rubric.md.
 */
export const SvgMaskRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <SvgMaskReveal
      shape="squircle"
      origin={{ x: 0.32, y: 0.36 }}
      delayInFrames={6}
      durationInFrames={90}
      rotation={40}
      backgroundColor="#07070B"
    >
      <Revealed />
    </SvgMaskReveal>
  </ScenePreviewPlate>
);
