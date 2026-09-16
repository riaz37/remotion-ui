"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AudiogramBars } from "../../registry/bases/default/primitives/audiogram-bars";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { PreviewFrame } from "./preview-frame";
import { ambientGlowBackground } from "./preview-stage";

export const AudiogramBarsPreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;

  return (
    <PreviewFrame lane="signals" padding={0}>
      <AbsoluteFill>
        {/* Doc rules 14 and 34. `premountFor` mounts the tag a second early so the
          decoder is warm before the first visible frame, and
          `pauseWhenBuffering`, which lives on the HTML5 fallback props (the
          path that can actually stall), holds the Player on a slow source
          instead of running silence under a live meter. */}
        <Sequence from={0} premountFor={fps}>
          <Audio
            src={audioSrc}
            loop
            fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
          />
        </Sequence>
        <AbsoluteFill
          style={{
            background: ambientGlowBackground(),
          }}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "56px 64px 88px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 860 }}>
            <AudiogramBars
              src={audioSrc}
              height={160}
              barColor={DEMO_PALETTE.phosphor}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </PreviewFrame>
  );
};
