"use client";

import { GaugeDial } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * Samples land at frames 18, 60 and 108. The sweep runs from frame 10 to 80 —
 * the needle is roughly half way round at the first sample and nearly home at
 * the second — and the power-down at 96 unwinds it again for the third.
 */
export const GaugeDialPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <GaugeDial
      value={78}
      label="Render budget"
      unit="%"
      size={380}
      delayInFrames={10}
      durationInFrames={70}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
