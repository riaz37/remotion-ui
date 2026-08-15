"use client";

import { useCurrentFrame } from "remotion";
import { MotionTrail } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const BOX = { width: 816, height: 396 } as const;

/**
 * The subject has to animate from `useCurrentFrame()` — the trail is this
 * subtree re-rendered at earlier frames, so a statically positioned child would
 * stack every echo in one place.
 *
 * The two axes run on 70 and 33-frame clocks. Neither is near the audit's 42
 * and 48-frame sample gaps, and their ratio is not a simple one, so the puck is
 * somewhere different at each of frames 18, 60 and 108.
 */
const Puck: React.FC = () => {
  const frame = useCurrentFrame();
  const x = Math.sin((frame / 70) * Math.PI * 2) * 262;
  const y = Math.sin((frame / 33) * Math.PI * 2 + 0.7) * 118;

  return (
    <div style={{ ...BOX, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          padding: "26px 44px",
          borderRadius: 999,
          background: "linear-gradient(120deg, #ffe0ad 0%, #e8b86d 60%, #c88b3e 100%)",
          color: "#140d04",
          fontSize: 40,
          fontWeight: 600,
          whiteSpace: "nowrap",
          transform: `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px))`,
        }}
      >
        Motion trail
      </div>
    </div>
  );
};

export const MotionTrailPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <MotionTrail count={9} gapInFrames={3} opacity={0.55} falloff={1.4} blur={6} scale={0.72}>
      <Puck />
    </MotionTrail>
  </PreviewFrame>
);
