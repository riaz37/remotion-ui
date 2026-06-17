"use client";

import { BRollStack } from "../registry-exports";
import {
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
} from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const BRollStackPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <BRollStack
      kicker="Supporting visuals"
      title="Proof shots behind narration"
      caption="Drop in screen captures, process clips, or customer moments."
      items={[
        {
          src: DEMO_MEDIA_SRC,
          title: "Product screen",
          caption: "Feature walkthrough",
          fit: "contain",
        },
        {
          src: DEMO_MEDIA_ALT_SRC,
          title: "Team workflow",
          caption: "Behind the build",
          fit: "contain",
        },
        {
          src: DEMO_MEDIA_THIRD_SRC,
          title: "Customer result",
          caption: "Proof point",
          fit: "contain",
        },
      ]}
    />
  </ScenePreviewPlate>
);
