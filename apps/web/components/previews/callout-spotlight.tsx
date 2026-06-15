"use client";

import { CalloutSpotlight } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const CalloutSpotlightPreview: React.FC = () => (
  <CalloutSpotlight
    kicker="Tutorial"
    title="Point viewers to the action"
    subtitle="Use coordinates to highlight a product region."
    backgroundSrc={DEMO_MEDIA_SRC}
    target={{ x: 210, y: 170, width: 420, height: 260 }}
  />
);
