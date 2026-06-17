"use client";

import { transitionBlurReveal } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionBlurRevealPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionBlurReveal({ durationInFrames: TRANSITION_FRAMES })}
  />
);
