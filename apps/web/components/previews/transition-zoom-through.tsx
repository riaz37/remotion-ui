"use client";

import { transitionZoomThrough } from "../../registry/bases/default/primitives/zoom-through";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionZoomThroughPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionZoomThrough({ durationInFrames: TRANSITION_FRAMES })}
  />
);
