"use client";

import { MediaSequence } from "../registry-exports";
import {
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
} from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const MediaSequencePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <MediaSequence
      items={[
        {
          src: DEMO_MEDIA_SRC,
          title: "Dashboard overview",
          caption: "Frame the product in one glance.",
        },
        {
          src: DEMO_MEDIA_ALT_SRC,
          title: "Workflow detail",
          caption: "Zoom into the step that changed.",
        },
        {
          src: DEMO_MEDIA_THIRD_SRC,
          title: "Result screen",
          caption: "Hold on the outcome viewers should remember.",
        },
      ]}
    />
  </ScenePreviewPlate>
);
