"use client";

import { transitionZoomThrough } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionZoomThroughPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionZoomThrough({ durationInFrames: TRANSITION_FRAMES })}
  />
);
