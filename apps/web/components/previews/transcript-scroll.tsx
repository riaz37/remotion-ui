"use client";

import { TranscriptScroll } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const CUES = [
  { speaker: "Nadia", text: "Where did the old pipeline break down?", startMs: 0, endMs: 700 },
  {
    speaker: "Sam",
    text: "Every copy change meant re-cutting the whole timeline by hand.",
    startMs: 700,
    endMs: 1500,
  },
  {
    speaker: "Sam",
    text: "Nobody wanted to touch a video once it shipped.",
    startMs: 1500,
    endMs: 2200,
  },
  { speaker: "Nadia", text: "And now?", startMs: 2200, endMs: 2700 },
  {
    speaker: "Sam",
    text: "Now the transcript is the edit. Change the words, render again.",
    startMs: 2700,
    endMs: 3500,
  },
  {
    speaker: "Nadia",
    text: "That is the part I did not believe until I saw it.",
    startMs: 3500,
    endMs: 4000,
  },
];

/**
 * Samples land at frames 18, 60 and 108 — 600ms, 2000ms and 3600ms — three
 * different active lines, and the page is still gliding toward each of them
 * because the settle runs 16 frames after every cue starts.
 */
export const TranscriptScrollPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={56}>
    <TranscriptScroll
      cues={CUES}
      width={740}
      height={400}
      fontSize={32}
    />
  </PreviewFrame>
);
