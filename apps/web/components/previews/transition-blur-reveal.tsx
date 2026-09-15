"use client";

import { transitionBlurReveal } from "../../registry/bases/default/primitives/blur-reveal";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionBlurRevealPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionBlurReveal({ durationInFrames: TRANSITION_FRAMES })}
  />
);
