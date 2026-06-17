"use client";

import { TimelineSteps } from "../registry-exports";
import { DEMO_TIMELINE_STEPS } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const TimelineStepsPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TimelineSteps
      title="Story arc"
      steps={DEMO_TIMELINE_STEPS}
    />
  </ScenePreviewPlate>
);
