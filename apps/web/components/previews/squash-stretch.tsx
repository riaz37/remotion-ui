"use client";

import { AbsoluteFill } from "remotion";
import { SquashStretch } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const Ball: React.FC = () => (
  <div
    style={{
      width: 196,
      height: 196,
      borderRadius: 999,
      background: "radial-gradient(circle at 36% 30%, #ffe9c4 0%, #e8b86d 52%, #a8692c 100%)",
    }}
  />
);

/**
 * A 33-frame bounce. The audit samples land at 0.55, 0.82 and 0.27 of the
 * cycle — near the apex, on the way down, and climbing — so the three stills
 * catch a different height *and* a different deform. On the component's 36-frame
 * default two of them would sit at nearly the same point of the arc.
 *
 * The floor line is preview chrome, not part of the component: squash without a
 * surface to squash against reads as a scale glitch.
 */
export const SquashStretchPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 96 }}>
      <SquashStretch
        mode="bounce"
        periodInFrames={33}
        travel={196}
        squash={0.34}
        stretch={0.2}
        contact={0.24}
      >
        <Ball />
      </SquashStretch>
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 96 }}>
      <div style={{ width: 620, height: 2, background: "rgba(255,255,255,0.18)" }} />
    </AbsoluteFill>
  </PreviewFrame>
);
