"use client";

import { PathDraw } from "../registry-exports";
import { DEMO_LOGO_PATH, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/** Underline drawn after the mark, so the stagger is visible in the preview. */
const UNDERLINE_PATH = "M 48 196 L 148 196";

export const PathDrawPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <PathDraw
      d={[DEMO_LOGO_PATH, UNDERLINE_PATH]}
      width={400}
      height={400}
      stroke={DEMO_PALETTE.phosphor}
      strokeWidth={6}
      durationInFrames={78}
      staggerInFrames={16}
    />
  </PreviewFrame>
);
