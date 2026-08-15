"use client";

import { CaptionEmojiBeat } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const BEATS = [
  { emoji: "🔥", atInFrames: 10, x: 22, y: 26, rotate: -8 },
  { emoji: "✨", atInFrames: 26, x: 76, y: 22, rotate: 10 },
  { emoji: "🎬", atInFrames: 44, x: 16, y: 72, rotate: 6 },
  { emoji: "💥", atInFrames: 62, x: 82, y: 70, rotate: -12 },
  { emoji: "🚀", atInFrames: 80, x: 50, y: 16, scale: 96 },
  { emoji: "👀", atInFrames: 96, x: 50, y: 82, rotate: 4 },
];

/**
 * Samples land at frames 18, 60 and 108. Six stamps land between frames 10 and
 * 96, each holding 26 frames before it releases, so every sample catches a
 * different set mid-wobble.
 */
export const CaptionEmojiBeatPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <CaptionEmojiBeat
      beats={BEATS}
      text="Punctuate the beat, not the sentence"
      fontSize={54}
      size={88}
      textAtInFrames={4}
    />
  </PreviewFrame>
);
