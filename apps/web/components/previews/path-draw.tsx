"use client";

import { PathDraw } from "../registry-exports";
import { DEMO_LOGO_PATH, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const PathDrawPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <PathDraw
      d={DEMO_LOGO_PATH}
      width={220}
      height={220}
      viewBox="0 0 200 200"
      stroke={DEMO_PALETTE.phosphor}
      durationInFrames={75}
    />
  </PreviewFrame>
);
