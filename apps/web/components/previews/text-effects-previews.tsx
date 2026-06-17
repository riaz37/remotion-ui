"use client";

import {
  BlurFocusIn,
  InfiniteMarquee,
  LightSweepText,
  MarkerHighlight,
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
import { PreviewFrame } from "./preview-frame";

const sample = DEMO_COPY.productLaunch.featureTitle;
const sub = DEMO_COPY.tutorial.calloutSubtitle;

const center = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const BlurFocusInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><BlurFocusIn text={sample} /></div>
  </PreviewFrame>
);

export const StaggeredFadeUpPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><StaggeredFadeUp text={`${sample} ${sub}`} /></div>
  </PreviewFrame>
);

export const MaskedSlideRevealPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><MaskedSlideReveal text={`${sample} ${sub}`} /></div>
  </PreviewFrame>
);

export const TrackingInPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><TrackingIn text={sample} /></div>
  </PreviewFrame>
);

export const LightSweepTextPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}><LightSweepText text={sample} /></div>
  </PreviewFrame>
);

export const MarkerHighlightPreview = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={center}>
      <MarkerHighlight text={`Ship with ${sample}`} highlightWord={sample.split(" ")[0] ?? sample} />
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
    <div style={center}><RgbGlitchText text={sample} /></div>
  </PreviewFrame>
);

export const InfiniteMarqueePreview = () => (
  <PreviewFrame lane="atoms" padding={48}>
    <InfiniteMarquee text={sample} />
  </PreviewFrame>
);

export const PerspectiveMarqueePreview = () => (
  <PreviewFrame lane="atoms" padding={48}>
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
