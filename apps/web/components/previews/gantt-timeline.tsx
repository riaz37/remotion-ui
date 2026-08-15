"use client";

import { GanttTimeline } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const COLUMNS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const TASKS = [
  { label: "Scene spec", start: 0, end: 2, progress: 1 },
  { label: "Registry build", start: 1, end: 4, progress: 0.8 },
  { label: "Preview audit", start: 3, end: 5.5, progress: 0.45 },
  { label: "Docs pass", start: 4.5, end: 7 },
  { label: "Render farm", start: 5, end: 8 },
  { label: "Launch", start: 7.6, end: 7.6, milestone: true },
];

/**
 * Samples land at frames 18, 60 and 108. Six bars of 26 frames on a 13-frame
 * stagger wipe from frame 10 to 101 — one row is running at the first sample
 * and four at the second — and the top-down exit at 96 covers the third.
 */
export const GanttTimelinePreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <GanttTimeline
      tasks={TASKS}
      columns={COLUMNS}
      width={780}
      rowHeight={44}
      gap={10}
      labelWidth={210}
      markerAt={5.5}
      markerLabel="Today"
      delayInFrames={4}
      durationInFrames={26}
      staggerInFrames={13}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
