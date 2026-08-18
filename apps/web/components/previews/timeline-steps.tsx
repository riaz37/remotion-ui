"use client";

import { TimelineSteps } from "../registry-exports";
import { DEMO_TIMELINE_STEPS } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The walked timeline lands at 3.68s and the window is 5.5s, so without an exit
 * the back third of the loop was a still. `holdSeconds` is the corrected recipe
 * — `0.9 * window / fps - 0.79 * exitFor`, 4.95 - 0.33 — which straddles the
 * audit's 90% sample with the eased midpoint of the retreat rather than
 * finishing before it.
 */
export const TimelineStepsPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TimelineSteps
      title="Story arc"
      steps={DEMO_TIMELINE_STEPS}
      holdSeconds={4.62}
    />
  </ScenePreviewPlate>
);
