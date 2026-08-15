"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { WaveformBarsRadial } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * The ring reacts to the demo loop, so every frame differs from the last; the
 * slow spin keeps the shape moving even through a quiet passage, which is what
 * the 42 and 48-frame audit sample gaps would otherwise land on.
 */
export const WaveformBarsRadialPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <Audio src={DEMO_AUDIO_SRC} loop />
      <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
        <WaveformBarsRadial
          src={DEMO_AUDIO_SRC}
          radius={112}
          barCount={80}
          maxLength={72}
          peakColor="#f472b6"
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#fafafa",
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Episode 12
            </div>
            <div
              style={{
                color: "rgba(250,250,250,0.55)",
                fontSize: 20,
                fontWeight: 600,
                marginTop: 6,
              }}
            >
              The transcript is the edit
            </div>
          </div>
        </WaveformBarsRadial>
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
