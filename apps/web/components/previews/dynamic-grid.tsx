"use client";

import { DynamicGrid } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * The grid is the subject, so nothing sits on top of it but a corner chip.
 *
 * The component's defaults do not survive this render path: the audit samples
 * at `--scale 0.5`, where a 1px line is half a device pixel and Chromium drops
 * the gradient stop outright — the first fix attempt raised alpha alone and the
 * plate still came back empty. Lines are 3px at 26% alpha on 96px cells, with
 * the plate lightened a step so the pattern reads through the vignette.
 *
 * Timing matches the 90-frame preview window (`lib/preview-config.ts`): a
 * 150-frame sweep left two thirds of every loop with no motion in it, and the
 * default 0.4px/frame drift covered barely half a cell.
 */
export const DynamicGridPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={0}>
      <DynamicGrid
        backgroundColor="#0a0a14"
        lineColor="rgba(255,255,255,0.26)"
        lineWidth={3}
        spacing={96}
        speed={1.6}
        sweepDurationInFrames={90}
      />
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 40,
          padding: "12px 22px",
          borderRadius: 8,
          background: "rgba(10,10,20,0.72)",
          border: `1px solid ${tokens.panelBorder}`,
          color: tokens.muted,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Dynamic grid
      </div>
    </PreviewFrame>
  );
};
