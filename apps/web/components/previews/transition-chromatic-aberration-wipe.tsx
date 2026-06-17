"use client";

import { transitionChromaticAberrationWipe } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionChromaticAberrationWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionChromaticAberrationWipe({
      durationInFrames: TRANSITION_FRAMES,
    })}
  />
);
