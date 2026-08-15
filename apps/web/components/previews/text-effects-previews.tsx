"use client";

import {
  BlurFocusIn,
  InfiniteMarquee,
  LightSweepText,
  MaskedSlideReveal,
  MatrixDecode,
  PerspectiveMarquee,
  RgbGlitchText,
  SlotRoll,
  StaggeredFadeUp,
  StrikethroughReplace,
  TrackingIn,
} from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, PreviewGhostStack } from "./preview-frame";

const sample = DEMO_COPY.productLaunch.featureTitle;
const sub = DEMO_COPY.tutorial.calloutSubtitle;

const center = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

const maskedSlideLines = [
  sample,
  "Drop scenes into",
  "TransitionSeries",
];

const maskedSlideGhostStyle = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

/**
 * Preview timing convention for this file.
 *
 * The audit samples every preview at 15% / 50% / 90% of its window — on the
 * default 120-frame window that is frames 18, 60 and 108. A text effect left on
 * its own short default starts at frame 0 and is finished well before frame 18,
 * so all three samples land on resolved type and the tile reads as a still
 * image. Each preview therefore delays its entrance and stretches it so the
 * effect is mid-flight at the enter sample and settled by the hold sample.
 */
const ENTER_SAMPLE_FRAME = 18;

export const BlurFocusInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <BlurFocusIn
        text={sample}
        delayInFrames={ENTER_SAMPLE_FRAME - 2}
        durationInFrames={54}
      />
    </div>
  </PreviewFrame>
);

export const StaggeredFadeUpPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><StaggeredFadeUp text={`${sample} ${sub}`} /></div>
  </PreviewFrame>
);

export const MaskedSlideRevealPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <PreviewGhostStack
      ghost={
        <div style={maskedSlideGhostStyle}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.18em",
              fontSize: 64,
              fontWeight: 600,
              color: "#f4f4f5",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {maskedSlideLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      }
    >
      <div style={maskedSlideGhostStyle}>
        {/* The 6/16 default landed all three lines by frame 28, so every sample
            caught a settled headline. Stretched so one line is still climbing
            out of its mask at each sample. */}
        <MaskedSlideReveal
          lines={maskedSlideLines}
          delayInFrames={10}
          staggerInFrames={18}
          durationInFrames={26}
        />
      </div>
    </PreviewGhostStack>
  </PreviewFrame>
);

export const TrackingInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><TrackingIn text={sample} /></div>
  </PreviewFrame>
);

export const LightSweepTextPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    {/* A sweep is a travelling highlight, not an entrance: the 48-frame default
        finished in the first sixth of the window and the tile held dead grey
        type for the rest. The shine now crosses the whole line across the
        whole window. */}
    <div style={center}>
      <LightSweepText text={sample} delayInFrames={6} durationInFrames={100} />
    </div>
  </PreviewFrame>
);

export const SlotRollPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><SlotRoll from="12840" to="50291" /></div>
  </PreviewFrame>
);

export const MatrixDecodePreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><MatrixDecode text={sample.toUpperCase()} /></div>
  </PreviewFrame>
);

export const RgbGlitchTextPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      {/* Three bursts spread across the window: the first is still tearing at
          the enter sample, the second peaks past the middle, and the signal has
          settled by the exit sample. A 34-frame glitch fell entirely between
          samples and never appeared. */}
      <RgbGlitchText
        text="SIGNAL LOCK"
        glitchStartFrame={ENTER_SAMPLE_FRAME - 8}
        glitchDurationInFrames={96}
        maxWidth="100%"
      />
    </div>
  </PreviewFrame>
);

export const InfiniteMarqueePreview = () => (
  <PreviewFrame lane="atoms" padding={48}>
    <InfiniteMarquee text={sample} />
  </PreviewFrame>
);

export const PerspectiveMarqueePreview = () => (
  <PreviewFrame lane="atoms" padding={0} justifyContent="stretch" alignItems="stretch">
    <PerspectiveMarquee text={sample} />
  </PreviewFrame>
);

export const StrikethroughReplacePreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <StrikethroughReplace from="Draft clip" to="Shipped clip" />
    </div>
  </PreviewFrame>
);
