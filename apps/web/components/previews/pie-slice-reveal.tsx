"use client";

import { PieSliceReveal } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const SLICES = [
  { label: "Pro", value: 44 },
  { label: "Team", value: 26 },
  { label: "Free", value: 18 },
  { label: "Trial", value: 12 },
];

/**
 * Samples land at frames 18, 60 and 108. Four sweeps of 30 frames on an
 * 18-frame stagger run from frame 8 to frame 92, so no sample sits on a settled
 * pie, and the fan-out exit at 96 carries the tail.
 */
export const PieSliceRevealPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <PieSliceReveal
      slices={SLICES}
      size={360}
      delayInFrames={8}
      durationInFrames={30}
      staggerInFrames={18}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
