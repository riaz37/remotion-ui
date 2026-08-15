"use client";

import { SparklineRow } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const ROWS = [
  {
    label: "Renders / day",
    values: [180, 240, 210, 320, 300, 420, 480, 610],
    value: "610",
    delta: "+24%",
  },
  {
    label: "Median render",
    values: [92, 88, 84, 86, 74, 70, 66, 61],
    value: "61s",
    delta: "-18%",
    color: "#2dd4bf",
  },
  {
    label: "Installs",
    values: [12, 18, 16, 27, 34, 31, 46, 58],
    value: "58",
    delta: "+11%",
    color: "#f472b6",
  },
  {
    label: "Failed jobs",
    values: [7, 6, 8, 5, 4, 4, 3, 2],
    value: "2",
    delta: "-40%",
    color: "#8b8bf5",
  },
];

/**
 * Samples land at frames 18, 60 and 108. Four draws of 40 frames on a 20-frame
 * stagger run from frame 6 to 106, so the first sample catches row one mid-draw
 * and the second sits between rows three and four; the top-down exit at 96
 * overlaps the last of it.
 */
export const SparklineRowPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <SparklineRow
      rows={ROWS}
      width={800}
      rowHeight={88}
      sparkWidth={240}
      delayInFrames={6}
      durationInFrames={40}
      staggerInFrames={20}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
