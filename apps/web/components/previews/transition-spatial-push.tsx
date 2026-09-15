"use client";

import { transitionSpatialPush } from "../../registry/bases/default/primitives/spatial-push";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionSpatialPushPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionSpatialPush({
      durationInFrames: TRANSITION_FRAMES,
      direction: "from-left",
    })}
  />
);
