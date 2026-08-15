"use client";

import { AbsoluteFill } from "remotion";
import { AudioScrubber } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const MARKS = [
  { atInFrames: 30, label: "Intro" },
  { atInFrames: 66, label: "Quote" },
  { atInFrames: 100, label: "Outro" },
];

/**
 * The playhead crosses the track over the full 120-frame window, passing a
 * different chapter mark before each audit sample, so no sample sits on a
 * settled frame.
 */
export const AudioScrubberPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 64px" }}>
      <AudioScrubber
        durationInFrames={120}
        width={800}
        height={110}
        barCount={90}
        marks={MARKS}
      />
    </AbsoluteFill>
  </PreviewFrame>
);
