"use client";

import { interpolate, useCurrentFrame } from "remotion";
import { ShapeMorph } from "../registry-exports";
import { EASING } from "@/remotion/lib/motion-tokens";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

const SHAPES = ["circle", "squircle", "triangle", "diamond"] as const;

/** Frames the chain takes, end to end. */
const CHAIN_FRAMES = 96;
/**
 * The exit has to *straddle* the 90% sample (frame 108 of 120), not finish on
 * it: opacity is gone by roughly 70% of an exit window, so starting at 92 with
 * a 16-frame exit left frame 108 blank. 100 + 22 keeps the shape mid-shrink
 * there. See docs-internal/preview-audit-rubric.md.
 */
const EXIT_AT = 100;
const EXIT_FOR = 22;

/**
 * Names the shape the chain is currently on, so the tile reads as a morph
 * chain rather than an orange blob. Uses the component's own ramp — the
 * editorial curve holds near the first shape far longer than a linear read of
 * the frame would suggest.
 */
const ShapeCaption: React.FC = () => {
  const tokens = usePreviewStage();
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, CHAIN_FRAMES], [0, 1], {
    easing: EASING.editorial,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const index = Math.min(
    SHAPES.length - 1,
    Math.max(0, Math.round(progress * (SHAPES.length - 1))),
  );
  const opacity = interpolate(frame, [EXIT_AT, EXIT_AT + EXIT_FOR], [1, 0], {
    easing: EASING.exit,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        opacity,
      }}
    >
      <span
        style={{
          color: tokens.ink,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: 0,
        }}
      >
        {SHAPES[index]}
      </span>
      <span style={{ color: tokens.muted, fontSize: 30, fontWeight: 500 }}>
        {index + 1} / {SHAPES.length}
      </span>
    </div>
  );
};

export const ShapeMorphPreview: React.FC = () => (
  <PreviewFrame lane="vectors" padding={20}>
    <div style={{ display: "grid", justifyItems: "center", gap: 14 }}>
      <ShapeMorph
        shapes={[...SHAPES]}
        size={420}
        durationInFrames={CHAIN_FRAMES}
        exitAtInFrames={EXIT_AT}
        exitInFrames={EXIT_FOR}
      />
      <ShapeCaption />
    </div>
  </PreviewFrame>
);
