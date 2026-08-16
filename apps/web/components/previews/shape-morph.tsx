"use client";

import { ShapeMorph } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * Four shapes over 96 frames, so the chain is mid-hop at frames 18 and 60, and
 * the exit at frame 92 covers frame 108. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ShapeMorphPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <ShapeMorph
      shapes={["circle", "squircle", "triangle", "diamond"]}
      size={300}
      durationInFrames={96}
      exitAtInFrames={92}
    />
  </PreviewFrame>
);
