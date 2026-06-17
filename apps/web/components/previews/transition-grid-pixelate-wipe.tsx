"use client";

import { transitionGridPixelateWipe } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionGridPixelateWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionGridPixelateWipe({
      durationInFrames: TRANSITION_FRAMES,
    })}
  />
);
