import type { Caption } from "@remotion/captions";

export const DEMO_AUDIO_SRC =
  "https://remotion.media/audio.wav";

export const DEMO_CAPTIONS: Caption[] = [
  { text: " Welcome", startMs: 0, endMs: 400, timestampMs: 0, confidence: 1 },
  { text: " to", startMs: 400, endMs: 600, timestampMs: 400, confidence: 1 },
  {
    text: " RemotionUI",
    startMs: 600,
    endMs: 1200,
    timestampMs: 600,
    confidence: 1,
  },
  {
    text: " signals",
    startMs: 1200,
    endMs: 2000,
    timestampMs: 1200,
    confidence: 1,
  },
];

/** Stylized “R” mark for logo-reveal / path-draw demos */
export const DEMO_LOGO_PATH =
  "M 52 28 L 52 172 L 96 172 Q 138 172 138 128 Q 138 96 108 88 L 144 28 L 112 28 L 92 78 L 84 78 L 84 28 Z";
