"use client";

import { FileTreeReveal } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Seven rows rather than the default eleven: the panel sizes itself from the
 * row count, so a shorter tree fills ~75% of the frame width and lands the
 * filenames at 24px on the 960 stage — readable at a 308px tile, which eleven
 * rows never were.
 *
 * `holdSeconds={3.27}` = 0.9 × 120 / 30 − 0.79 × 0.42, the exit-easing-corrected
 * recipe; it straddles frame 108 with the exit about half done.
 * See docs-internal/preview-audit-rubric.md.
 */
export const FileTreeRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <FileTreeReveal
      nodes={[
        {
          name: "src",
          children: [
            {
              name: "scenes",
              children: [{ name: "hook-card.tsx" }, { name: "lower-third.tsx" }],
            },
            { name: "lib", children: [{ name: "motion-tokens.ts" }] },
            { name: "index.ts" },
          ],
        },
      ]}
      rowStagger={0.15}
      holdSeconds={3.27}
    />
  </ScenePreviewPlate>
);
