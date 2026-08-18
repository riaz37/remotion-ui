"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AudioPulse } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const AudioPulsePreview: React.FC = () => {
  const { fps } = useVideoConfig();

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
            src={DEMO_AUDIO_SRC}
            loop
            fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
          />
        </Sequence>
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(232,184,109,0.16) 0%, transparent 46%), radial-gradient(circle at 82% 64%, rgba(45,212,191,0.10) 0%, transparent 52%), linear-gradient(to bottom, #050510 0%, #080810 100%)",
          }}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 64,
          }}
        >
          <AudioPulse
            src={DEMO_AUDIO_SRC}
            size={252}
            color={DEMO_PALETTE.phosphor}
            ringCount={4}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </PreviewFrame>
  );
};
