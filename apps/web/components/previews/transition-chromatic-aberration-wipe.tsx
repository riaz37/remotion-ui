"use client";

import { transitionChromaticAberrationWipe } from "../../registry/bases/default/primitives/chromatic-aberration-wipe";
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
