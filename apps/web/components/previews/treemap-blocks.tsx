"use client";

import { TreemapBlocks } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const BLOCKS = [
  { label: "Atoms", value: 46 },
  { label: "Blocks", value: 31 },
  { label: "Signals", value: 26 },
  { label: "Cuts", value: 18 },
  { label: "Reels", value: 12 },
  { label: "Vectors", value: 7 },
  { label: "Spatial", value: 4 },
];

/**
 * Samples land at frames 18, 60 and 108. Seven blocks of 22 frames on a
 * 12-frame stagger arrive from frame 4 to 98, so the map is two tiles in at the
 * first sample and five at the second, and the collapse at 96 runs under the
 * third.
 */
export const TreemapBlocksPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <TreemapBlocks
      blocks={BLOCKS}
      width={760}
      height={380}
      delayInFrames={4}
      durationInFrames={22}
      staggerInFrames={12}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
