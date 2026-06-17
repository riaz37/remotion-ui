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
      title="Layer cutaways behind the narration"
      items={[
        { src: DEMO_MEDIA_SRC, title: "Product screen" },
        { src: DEMO_MEDIA_ALT_SRC, title: "Team workflow" },
        { src: DEMO_MEDIA_THIRD_SRC, title: "Customer result" },
      ]}
    />
  </ScenePreviewPlate>
);
