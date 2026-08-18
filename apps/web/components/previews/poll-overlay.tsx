"use client";

import { AbsoluteFill } from "remotion";
import { PollOverlay } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Stand-in for the stream under the overlay. */
const StreamBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 22% 26%, rgba(232,184,109,0.16), transparent 34%), linear-gradient(135deg, #0c1120 0%, #151a26 52%, #070810 100%)",
    }}
  />
);

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The card is still opening at 18, the bars are still
 * travelling at 60, and `holdSeconds={3.27}` puts frame 108 mid-exit rather than
 * on a settled card. See docs-internal/preview-audit-rubric.md.
 */
export const PollOverlayPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <StreamBackdrop />
    <PollOverlay
      badge="Poll"
      question="Which should we build next?"
      options={[
        { label: "Timeline editor", votes: 412 },
        { label: "Batch renders", votes: 268 },
        { label: "Team presets", votes: 143 },
      ]}
      totalLabel="823 votes · closes in 2m"
      align="center"
      holdSeconds={3.27}
    />
  </PreviewFrame>
);
