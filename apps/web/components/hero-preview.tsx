"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { PreviewPanel } from "./preview-panel";
import { HeroLoopPreview } from "./previews/hero-loop";

export function HeroPreview() {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(0);
    const id = window.requestAnimationFrame(() => player.play());
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <PreviewPanel title="Live preview" aspectRatio="16 / 9">
      <Player
        ref={playerRef}
        component={HeroLoopPreview}
        durationInFrames={450}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{ width: "100%", height: "100%", display: "block" }}
        controls={false}
        loop
        autoPlay
        clickToPlay={false}
        initiallyMuted
        showPosterWhenUnplayed={false}
        acknowledgeRemotionLicense
      />
    </PreviewPanel>
  );
}
