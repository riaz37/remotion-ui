"use client";

import { Easing } from "remotion";
import { ProgressBar } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * An ease-in-out, not the component's default expo-out.
 *
 * `EASING_ENTER` is ~90% resolved a third of the way in, so a 98-frame fill
 * covered 79→84% across the whole back half of the window: numerically alive,
 * visually a stopped bar. This curve keeps the fill moving through all three
 * audit samples (17% → 50% → 84%).
 */
const STEADY = Easing.bezier(0.45, 0, 0.55, 1);

/**
 * Three rows: a known fill on a curve, the same fill on a spring, and work with
 * no known end.
 *
 * The window is 110 frames, so the audit samples land on 16 / 55 / 99. The
 * shuttle runs at 1.2s = 36 frames, which puts those three on distinct phases
 * (26% / 38% / 72% across the track). 1.1s would be 33 frames and 99 is exactly
 * three of those — the 90% sample would catch the shuttle parked off the left
 * edge. See docs-internal/preview-audit-rubric.md on periods aliased against
 * the sample gaps.
 */
export const ProgressBarPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={64}>
      <div
        style={{
          width: 820,
          display: "grid",
          gap: 40,
          padding: "46px 52px",
          borderRadius: 8,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <ProgressBar
          from={0.14}
          progress={0.86}
          delayInFrames={6}
          durationInFrames={98}
          easing={STEADY}
          height={18}
          labelSize={26}
          label={`Rendering ${DEMO_COPY.productLaunch.title.toLowerCase()}`}
          showValue
          segments={4}
          color={DEMO_PALETTE.phosphor}
          labelColor={tokens.muted}
        />
        <ProgressBar
          from={0.2}
          progress={1}
          delayInFrames={26}
          durationInFrames={76}
          spring="smooth"
          height={18}
          labelSize={26}
          label="Encoding h.264"
          showValue
          color={DEMO_PALETTE.amber}
          labelColor={tokens.muted}
        />
        <ProgressBar
          indeterminate
          shuttleSeconds={1.2}
          height={18}
          labelSize={26}
          label="Uploading to storage"
          color={DEMO_PALETTE.teal}
          labelColor={tokens.muted}
        />
      </div>
    </PreviewFrame>
  );
};
