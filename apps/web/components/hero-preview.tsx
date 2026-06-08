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
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-fd-primary/10 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-fd-border bg-fd-card shadow-2xl shadow-black/25">
        <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-yellow-400" />
            <span className="size-2.5 rounded-full bg-green-400" />
          </div>
          <p className="font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground">
            intro.tsx · live Remotion preview
          </p>
        </div>
        <div className="bg-[var(--brand-stage)] p-3">
          <div className="overflow-hidden rounded-2xl border border-white/10">
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
        </div>
        <div className="grid grid-cols-3 border-t border-fd-border text-xs">
          {["Captions", "Counters", "Reel scenes"].map((item) => (
            <div
              key={item}
              className="border-r border-fd-border px-4 py-3 last:border-r-0"
            >
              <p className="font-medium">{item}</p>
              <p className="mt-1 text-fd-muted-foreground">source install</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
