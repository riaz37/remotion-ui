"use client";

import { SpeakerLabelCaptions } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const CUES = [
  { speaker: "Nadia", text: "So the whole edit is code now?", startMs: 0, endMs: 1250 },
  {
    speaker: "Sam",
    text: "Every scene. The captions come from the transcript.",
    startMs: 1300,
    endMs: 2550,
  },
  {
    speaker: "Nadia",
    text: "And a re-render picks up the copy change?",
    startMs: 2600,
    endMs: 3750,
  },
  { speaker: "Sam", text: "Same command, forty seconds.", startMs: 3800, endMs: 4200 },
];

/**
 * Samples land at frames 18, 60 and 108 — 600ms, 2000ms and 3600ms — so each
 * catches a different cue, with the previous speaker's card still dimmed
 * behind it and the live card part way through its rise.
 */
export const SpeakerLabelCaptionsPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <SpeakerLabelCaptions
      cues={CUES}
      speakers={[
        { name: "Nadia", color: "#e8b86d", align: "left" },
        { name: "Sam", color: "#2dd4bf", align: "right" },
      ]}
      fontSize={40}
    />
  </PreviewFrame>
);
