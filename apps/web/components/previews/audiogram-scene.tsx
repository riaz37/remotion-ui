"use client";

import { Audio } from "@remotion/media";
import { Sequence, useVideoConfig } from "remotion";
import { AudiogramScene } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_COPY, DEMO_LOGO_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AudiogramScenePreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <ScenePreviewPlate>
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
      <AudiogramScene
        src={DEMO_AUDIO_SRC}
        title={DEMO_COPY.podcast.title}
        subtitle={DEMO_COPY.podcast.subtitle}
        logoSrc={DEMO_LOGO_SRC}
      />
    </ScenePreviewPlate>
  );
};
