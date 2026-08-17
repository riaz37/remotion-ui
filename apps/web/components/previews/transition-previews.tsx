"use client";

import type { ComponentProps } from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import {
  TransitionLightLeak,
  transitionClockWipe,
  transitionFade,
  transitionSlide,
  transitionWipe,
} from "../registry-exports";
import { ProductCard, PreviewFrame } from "./preview-frame";
import { DARK_STAGE, LIGHT_STAGE, PreviewStageProvider } from "./preview-stage";
import { PREVIEW_DEFAULTS } from "@/lib/preview-config";

const TRANSITION_FRAMES = 18;
/**
 * Two scenes overlapping by TRANSITION_FRAMES must fill the whole 120-frame
 * preview composition: 69 + 69 - 18 = 120. At 54 the series ran out at frame 90
 * and every transition tile spent its last quarter on an empty stage.
 */
const SCENE_DURATION = (PREVIEW_DEFAULTS.durationInFrames + TRANSITION_FRAMES) / 2;

/**
 * The two scenes are deliberately opposite in luminance. Two dark cards read as
 * one continuous frame, which hides which way a wipe travelled, whether a push
 * moved both scenes, and whether the background ever showed through the cut.
 */
const BeforeScene: React.FC = () => (
  <PreviewStageProvider tokens={LIGHT_STAGE}>
    <PreviewFrame lane="cuts">
      <ProductCard
        kicker="Scene one"
        title="Editorial opener"
        detail="Holds the setup"
      />
    </PreviewFrame>
  </PreviewStageProvider>
);

const AfterScene: React.FC = () => (
  <PreviewStageProvider tokens={DARK_STAGE}>
    <PreviewFrame lane="cuts">
      <ProductCard
        kicker="Scene two"
        title="Feature spotlight"
        detail="Carries the payoff"
      />
    </PreviewFrame>
  </PreviewStageProvider>
);

type TransitionConfig = {
  presentation: unknown;
  timing: unknown;
};

function TransitionSeriesPreview({
  transition,
}: {
  transition: TransitionConfig;
}) {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <BeforeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          {...(transition as ComponentProps<typeof TransitionSeries.Transition>)}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <AfterScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

/**
 * An overlay does *not* shorten the series the way a transition does, so the
 * light-leak preview cannot reuse `SCENE_DURATION`: 69 + 69 = 138 against a
 * 120-frame composition truncated Scene two and moved the cut to frame 69,
 * where the audit's 18 / 60 / 108 samples straddle it and the flare — the whole
 * component — appeared in none of them.
 *
 * Two scenes, no overlap: 60 + 60 = 120, so the cut is exactly frame 60. The
 * overlay is centred on the cut by `TransitionSeries` itself
 * (`overlayFrom = cutPoint - durationInFrames / 2`), so 24 frames spans 48-72
 * and the 50% sample lands on the flare peak.
 */
const OVERLAY_SCENE_DURATION = PREVIEW_DEFAULTS.durationInFrames / 2;
const OVERLAY_FRAMES = 24;

function OverlaySeriesPreview() {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={OVERLAY_SCENE_DURATION}>
          <BeforeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={OVERLAY_FRAMES}>
          {/* Just under full intensity, so the peak frame still shows the cut
              it is covering rather than a blown-out plate. */}
          <TransitionLightLeak seed={2} hueShift={28} intensity={0.86} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence durationInFrames={OVERLAY_SCENE_DURATION}>
          <AfterScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

// `transitionClockWipe` reads the composition size itself, so the preview no
// longer needs a `useVideoConfig()` wrapper just to hand it width and height.
export const TransitionClockWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionClockWipe({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const TransitionFadePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionFade({ durationInFrames: TRANSITION_FRAMES })}
  />
);

export const TransitionSlidePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionSlide({
      direction: "from-left",
      durationInFrames: TRANSITION_FRAMES,
    })}
  />
);

export const TransitionWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionWipe({
      direction: "from-left",
      durationInFrames: TRANSITION_FRAMES,
    })}
  />
);

export const TransitionLightLeakPreview: React.FC = () => (
  <OverlaySeriesPreview />
);

export { TransitionSeriesPreview, BeforeScene, AfterScene, SCENE_DURATION, TRANSITION_FRAMES };
