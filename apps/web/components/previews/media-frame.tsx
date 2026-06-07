"use client";

import { MediaFrame } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const MediaFramePreview: React.FC = () => (
  <MediaFrame
    src={DEMO_MEDIA_SRC}
    title="Product demo"
    caption="Frame screenshots, videos, and launch visuals."
  />
);
