"use client";

import { transitionZoomThrough } from "../../registry/bases/default/primitives/zoom-through";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionZoomThroughPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionZoomThrough({ durationInFrames: TRANSITION_FRAMES })}
    label={{
      name: "Zoom through",
      beforeDetail: "Zooms forward through the frame",
      afterDetail: "Emerges out the other side of the zoom",
    }}
  />
);
