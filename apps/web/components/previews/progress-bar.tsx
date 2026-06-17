"use client";

import { ProgressBar } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const ProgressBarPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={96}>
    <ProgressBar
      progress={1}
      delayInFrames={6}
      durationInFrames={50}
      label={`Rendering ${DEMO_COPY.productLaunch.title.toLowerCase()} reel`}
      color={DEMO_PALETTE.phosphor}
    />
  </PreviewFrame>
);
