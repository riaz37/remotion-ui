"use client";

import { Player, type PlayerRef } from "@remotion/player";
import type { ComponentType, RefObject } from "react";
import { useEffect, useRef } from "react";

type ScaledPlayerStageProps = {
  playerRef: RefObject<PlayerRef | null>;
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps?: number;
  width: number;
  height: number;
  inputProps: Record<string, unknown>;
};

export function ScaledPlayerStage({
  playerRef,
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  inputProps,
}: ScaledPlayerStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPortrait = height > width;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect();
      const scale = Math.min(cw / width, ch / height);
      container.style.setProperty("--player-scale", String(scale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={
        isPortrait
          ? "mx-auto flex h-[min(65svh,680px)] max-h-[680px] w-full max-w-[380px] items-center justify-center overflow-hidden bg-[var(--bay-stage)]"
          : "relative w-full overflow-hidden bg-[var(--bay-stage)]"
      }
      style={
        isPortrait
          ? undefined
          : { aspectRatio: `${width} / ${height}` }
      }
    >
      <Player
        ref={playerRef}
        component={component}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={width}
        compositionHeight={height}
        style={{
          width,
          height,
          display: "block",
          transform: "scale(var(--player-scale, 1))",
          transformOrigin: "center center",
        }}
        inputProps={inputProps}
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
