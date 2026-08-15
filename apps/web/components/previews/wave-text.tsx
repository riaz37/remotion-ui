"use client";

import { WaveText } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. The wave is ambient, so it is moving at every sample.
 * The period is 32 frames because the samples are 42 and 48 frames apart: a
 * 44-frame period is within 5% of that first gap and put two of the three
 * stills on the same crest, which looks like a still image even though the
 * PSNR passes. Check the period against the sample gaps, not the window.
 */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const WaveTextPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <WaveText
        text="Ride the sine"
        amplitude={0.2}
        wavelength={5}
        periodInFrames={32}
        scale={0.08}
        shade={0.3}
        delayInFrames={2}
        staggerInFrames={3}
        durationInFrames={20}
        fontSize={82}
      />
    </div>
  </PreviewFrame>
);
