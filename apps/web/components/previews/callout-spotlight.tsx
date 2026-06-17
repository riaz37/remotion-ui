"use client";

import { CalloutSpotlight } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/** Target highlights the product card on the demo still — callout sits in the right column. */
export const CalloutSpotlightPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CalloutSpotlight
      kicker="Tutorial"
      title="Point viewers to the action"
      subtitle="Use coordinates to highlight a product region."
      backgroundSrc={DEMO_MEDIA_SRC}
      target={{ x: 84, y: 88, width: 300, height: 210 }}
    />
  </ScenePreviewPlate>
);
