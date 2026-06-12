"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
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
    <div className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-fd-primary/10 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--brand-stage)] shadow-2xl shadow-black/30">
        <div className="relative overflow-hidden rounded-3xl">
          <Player
            ref={playerRef}
            component={HeroLoopPreview}
            durationInFrames={450}
            fps={30}
            compositionWidth={1920}
            compositionHeight={1080}
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
      </div>
    </div>
  );
}
