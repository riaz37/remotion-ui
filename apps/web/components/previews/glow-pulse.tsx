"use client";

import { GlowPulse } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

const CtaPill: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "30px 56px",
      borderRadius: 999,
      background: "#e8b86d",
      color: "#100c06",
      fontSize: 46,
      fontWeight: 600,
      letterSpacing: -0.5,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 22, height: 22, borderRadius: 999, background: "#100c06" }} />
    {DEMO_COPY.endCard.ctaLabel}
  </div>
);

/**
 * A 33-frame beat, not the component's 36-frame default: the audit's samples
 * are 42 and 48 frames apart, and at 33 they land at 0.55, 0.82 and 0.27 of the
 * cycle — the tail of a beat, the quiet floor, and the top of the next one.
 * Three different glow levels rather than three readings of the same one.
 */
export const GlowPulsePreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <GlowPulse
      mode="beat"
      periodInFrames={33}
      radius={44}
      floor={0.22}
      scale={0.06}
      halo={3}
      echo={0.5}
    >
      <CtaPill />
    </GlowPulse>
  </PreviewFrame>
);
