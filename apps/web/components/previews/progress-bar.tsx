"use client";

import { ProgressBar } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/** Both modes side by side: a known fill, and work with no known end. */
export const ProgressBarPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={96}>
      <div
        style={{
          width: 700,
          display: "grid",
          gap: 44,
          padding: "48px 52px",
          borderRadius: 8,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <ProgressBar
          progress={0.82}
          delayInFrames={6}
          // Filled in 54 frames the bar was parked at 82% for the back half of
          // the window — a progress bar that has stopped is not a progress bar.
          durationInFrames={104}
          label={`Rendering ${DEMO_COPY.productLaunch.title.toLowerCase()}`}
          showValue
          segments={4}
          color={DEMO_PALETTE.phosphor}
          labelColor={tokens.muted}
        />
        <ProgressBar
          indeterminate
          label="Uploading to storage"
          color={DEMO_PALETTE.teal}
          labelColor={tokens.muted}
        />
      </div>
    </PreviewFrame>
  );
};
