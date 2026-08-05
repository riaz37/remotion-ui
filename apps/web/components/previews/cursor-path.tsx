"use client";

import { CursorPath } from "../registry-exports";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/** Waypoints in the 960x540 preview composition, kept inside the safe area. */
const ROUTE = [
  { x: 110, y: 430 },
  { x: 300, y: 180 },
  { x: 560, y: 330 },
  { x: 830, y: 120 },
];

export const CursorPathPreview: React.FC = () => (
  <PreviewFrame lane="vectors" padding={0}>
    <CursorPath
      points={ROUTE}
      color={DEMO_PALETTE.phosphor}
      durationInFrames={100}
      size={40}
      clickAt={[1, 3]}
    />
  </PreviewFrame>
);
