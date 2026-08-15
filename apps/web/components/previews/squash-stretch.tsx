"use client";

import { AbsoluteFill } from "remotion";
import { SquashStretch } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const Ball: React.FC = () => (
  <div
    style={{
      width: 220,
      height: 220,
      borderRadius: 999,
      background: "radial-gradient(circle at 36% 30%, #ffe9c4 0%, #e8b86d 52%, #a8692c 100%)",
    }}
  />
);

/**
 * A 27-frame bounce, chosen so that frame 108 — the audit's last sample — is
 * exactly a contact frame. The first cut ran at 33 and put all three samples
 * mid-flight: the numbers were healthy and the squash, which is the entire
 * point of the component, was never in a still. The other two samples land at
 * 0.67 and 0.22 of the cycle, so the sheet shows the apex, the fall and the
 * flatten.
 *
 * The floor line is preview chrome, not part of the component: squash without a
 * surface to squash against reads as a scale glitch.
 */
export const SquashStretchPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 96 }}>
      <SquashStretch
        mode="bounce"
        periodInFrames={27}
        travel={212}
        squash={0.34}
        stretch={0.2}
        contact={0.24}
      >
        <Ball />
      </SquashStretch>
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 96 }}>
      <div style={{ width: 700, height: 2, background: "rgba(255,255,255,0.18)" }} />
    </AbsoluteFill>
  </PreviewFrame>
);
