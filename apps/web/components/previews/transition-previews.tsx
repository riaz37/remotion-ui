"use client";

import type { ComponentProps } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import {
  TransitionLightLeak,
  transitionClockWipe,
  transitionFade,
  transitionSlide,
  transitionWipe,
} from "../registry-exports";
import { ProductCard, PreviewFrame } from "./preview-frame";

const SCENE_DURATION = 54;
const TRANSITION_FRAMES = 18;

const BeforeScene: React.FC = () => (
  <PreviewFrame lane="cuts">
    <ProductCard
      kicker="Before cut"
      title="Editorial opener"
      detail="Scene one holds the setup"
    />
  </PreviewFrame>
);

const AfterScene: React.FC = () => (
  <PreviewFrame lane="cuts">
    <ProductCard
      kicker="After cut"
      title="Feature spotlight"
      detail="Scene two carries the payoff"
    />
  </PreviewFrame>
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

function OverlaySeriesPreview() {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <BeforeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={TRANSITION_FRAMES}>
          <TransitionLightLeak seed={2} hueShift={28} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <AfterScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

function ClockWipePreviewInner() {
  const { width, height } = useVideoConfig();

  return (
    <TransitionSeriesPreview
      transition={transitionClockWipe({
        width,
        height,
        durationInFrames: TRANSITION_FRAMES,
      })}
    />
  );
}

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

export const TransitionClockWipePreview: React.FC = () => (
  <ClockWipePreviewInner />
);

export const TransitionLightLeakPreview: React.FC = () => (
  <OverlaySeriesPreview />
);

export { TransitionSeriesPreview, BeforeScene, AfterScene, SCENE_DURATION, TRANSITION_FRAMES };
