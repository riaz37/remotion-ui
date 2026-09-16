"use client";

import { Audio } from "@remotion/media";
import { Sequence, useVideoConfig } from "remotion";
import { AudiogramScene } from "../../registry/bases/default/scenes/audiogram-scene";
import { DEMO_COPY, DEMO_LOGO_SRC } from "@/lib/demo-assets";
import { useDemoAudioSrc } from "@/lib/demo-assets-audio";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AudiogramScenePreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const audioSrc = useDemoAudioSrc();
  // Shared in-memory copy; see lib/demo-assets-audio.ts.
  if (!audioSrc) return null;

  return (
    <ScenePreviewPlate>
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
      <AudiogramScene
        src={audioSrc}
        title={DEMO_COPY.podcast.title}
        subtitle={DEMO_COPY.podcast.subtitle}
        logoSrc={DEMO_LOGO_SRC}
      />
    </ScenePreviewPlate>
  );
};
