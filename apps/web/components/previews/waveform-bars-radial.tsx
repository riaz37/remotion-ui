"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { WaveformBarsRadial } from "../../registry/bases/default/primitives/waveform-bars-radial";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { PreviewFrame } from "./preview-frame";

/**
 * The ring reacts to the demo loop, so every frame differs from the last; the
 * slow spin keeps the shape moving even through a quiet passage, which is what
 * the 42 and 48-frame audit sample gaps would otherwise land on.
 */
export const WaveformBarsRadialPreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;

  return (
    <PreviewFrame lane="signals" padding={0}>
      <AbsoluteFill>
        {/* Doc rules 14 and 34. `premountFor` mounts the tag a second early so the
          decoder is warm before the first visible frame, and
          `pauseWhenBuffering` — which lives on the HTML5 fallback props, the
          path that can actually stall — holds the Player on a slow source
          instead of running silence under a live meter. */}
        <Sequence from={0} premountFor={fps}>
          <Audio
            src={audioSrc}
            loop
            fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
          />
        </Sequence>
        <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
          <WaveformBarsRadial
            src={audioSrc}
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
};
