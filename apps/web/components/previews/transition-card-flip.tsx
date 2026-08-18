"use client";

import { transitionCardFlip } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

/**
 * The cut is deliberately off-centre. A flip is edge-on at the exact midpoint of
 * its window — zero pixels wide, nothing but the backdrop — so the shared
 * 69 / 69 harness put the audit's 50% sample on the one frame of the whole
 * transition with no card in it.
 *
 * 71 + 67 - 18 = 120, so the pair still fills the composition. The overlap is
 * frames 53-71, which puts frame 60 at raw progress 0.39; through the editorial
 * ease that is ~0.29 of the turn, so the sample catches the outgoing face at
 * about 52° — foreshortened, shaded, unmistakably mid-flip — while the incoming
 * face is still culled behind it.
 */
export const TransitionCardFlipPreview: React.FC = () => (
  <TransitionSeriesPreview
    firstScene={71}
    secondScene={67}
    transition={transitionCardFlip({
      durationInFrames: TRANSITION_FRAMES,
      axis: "y",
    })}
  />
);
