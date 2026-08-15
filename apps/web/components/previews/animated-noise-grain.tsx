"use client";

import { AbsoluteFill } from "remotion";
import { AnimatedNoiseGrain } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * A midtone plate standing in for footage. Grain needs something to modulate,
 * and it needs it to be free of furniture: the demo media stills carry their
 * own UI bars, which a card placed over them collides with — the collision the
 * audit has already logged three times against other components.
 */
const FOOTAGE_PLATE =
  "radial-gradient(70% 80% at 24% 22%, #4a4238 0%, transparent 58%), radial-gradient(60% 70% at 82% 76%, #2e3a44 0%, transparent 62%), linear-gradient(160deg, #3a3a42 0%, #1b1c22 100%)";

/**
 * Grain is the only thing moving, so two things had to be true for this to
 * measure as motion at all.
 *
 * It sits over footage on `screen`, not over the near-black preview stage on
 * the component's default `overlay`. Overlay pivots around mid grey, so grain
 * composited onto #050505 changes nothing: the first cut measured 52 dB — a
 * dead preview whose component was working perfectly — and moving it onto a
 * dark-but-not-black plate only got it to 43. Screen lifts the blacks, which is
 * both what makes the grain visible here and what grain does in the shadows of
 * a real print.
 *
 * And the tile is coarse (`size` large, `density` low). The audit renders at
 * half scale, which averages fine grain out of existence; grain this size
 * survives the downsample and is also the only setting legible at 308px.
 */
export const AnimatedNoiseGrainPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <AnimatedNoiseGrain
      blendMode="screen"
      opacity={0.3}
      size={420}
      density={0.4}
      detail={2}
      holdInFrames={1}
      vignette={0.5}
    >
      <AbsoluteFill style={{ background: FOOTAGE_PLATE }} />
      <PreviewFrame lane="blocks" backgroundColor="transparent" padding={72}>
        <ProductCard
          kicker="Overlay layer"
          title="Film grain"
          detail={DEMO_COPY.creatorHook.subtitle}
        />
      </PreviewFrame>
    </AnimatedNoiseGrain>
  </PreviewFrame>
);
