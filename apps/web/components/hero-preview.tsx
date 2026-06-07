"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { IntroPreview } from "./previews/intro";

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
    <div className="overflow-hidden rounded-2xl border border-fd-border bg-[var(--brand-stage)] shadow-lg shadow-black/25">
      <Player
        ref={playerRef}
        component={IntroPreview}
        durationInFrames={150}
        fps={30}
        compositionWidth={960}
        compositionHeight={540}
        style={{ width: "100%", display: "block" }}
        controls={false}
        loop
        autoPlay
        clickToPlay={false}
        initiallyMuted
        showPosterWhenUnplayed={false}
        acknowledgeRemotionLicense
      />
    </div>
  );
}
