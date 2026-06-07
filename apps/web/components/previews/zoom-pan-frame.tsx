"use client";

import { ZoomPanFrame } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const ZoomPanFramePreview: React.FC = () => (
  <ZoomPanFrame src={DEMO_MEDIA_SRC} toScale={1.28} toX={-80} toY={36} />
);
