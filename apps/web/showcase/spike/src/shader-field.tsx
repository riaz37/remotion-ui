import { halftoneLinearGradient } from "@remotion/effects/halftone-linear-gradient";
import { noise } from "@remotion/effects/noise";
import { vignette } from "@remotion/effects/vignette";
import { interpolate, Solid, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Tier 1 — runs on plain WebGL2, so it works in the docs Player for every
 * visitor. No HTML-in-canvas, no Chrome flag.
 */
export const ShaderField: React.FC = () => {
  const { width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  const sweep = interpolate(progress, [0, 1], [0.15, 0.85]);
  const dotSize = interpolate(progress, [0, 0.5, 1], [10, 46, 18]);

  return (
    <Solid
      width={width}
      height={height}
      color="#08080c"
      effects={[
        halftoneLinearGradient({
          firstStopDotSize: 0,
          secondStopDotSize: dotSize,
          firstStopPosition: [sweep - 0.35, 0.1],
          secondStopPosition: [sweep + 0.35, 0.95],
          gridSize: 22,
          dotColor: "#5b8cff",
        }),
        noise({ amount: 0.06 }),
        vignette({ amount: 0.5 }),
      ]}
    />
  );
};
