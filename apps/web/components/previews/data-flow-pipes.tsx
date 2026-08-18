"use client";

import { DataFlowPipes } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Four stages on two rows rather than one band across the middle, and no
 * `detail` line: at a 308px tile the second line was under 2px and the stage
 * labels were barely more. Five payloads drain by 4.2s, and
 * `holdSeconds={4.62}` = 0.9 × 165 / 30 − 0.79 × 0.42 puts frame 148 mid-exit.
 * See docs-internal/preview-audit-rubric.md.
 */
export const DataFlowPipesPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <DataFlowPipes
      stages={[
        { label: "Ingest" },
        { label: "Transcode" },
        { label: "Caption" },
        { label: "Deliver" },
      ]}
      packets={5}
      holdSeconds={4.62}
    />
  </ScenePreviewPlate>
);
