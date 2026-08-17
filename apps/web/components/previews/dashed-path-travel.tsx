"use client";

import { DashedPathTravel } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The trip runs frames 4–80, so frame 18 is early on the route and frame 60 two
 * thirds along. It then holds the *completed* route for 16 frames — the frame
 * the component exists to produce, which the old timing showed for two frames —
 * and leaves across 96–112 so frame 108 catches the marked route mid-fade
 * rather than an empty plate.
 *
 * `EASING.exit` is `Easing.in(Easing.cubic)`, so the sample wants
 * `0.9·window − 0.79·exitFor` = 108 − 12.6 ≈ 96, not the 92 it had.
 * See docs-internal/preview-audit-rubric.md.
 */
export const DashedPathTravelPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <DashedPathTravel
      width={680}
      height={380}
      strokeWidth={4}
      dash={12}
      dotRadius={9}
      delayInFrames={4}
      durationInFrames={76}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
