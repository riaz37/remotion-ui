"use client";

import { Player, type PlayerRef } from "@remotion/player";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useCurrentPlayerFrame } from "@/lib/use-current-player-frame";
import { StudioPanel } from "./studio-panel";

type StudioPlayerPanelProps = {
  label: string;
  component: ComponentType;
  durationInFrames: number;
  fps?: number;
  width: number;
  height: number;
  showTimecode?: boolean;
  controls?: boolean;
  loop?: boolean;
  inputProps?: Record<string, unknown>;
  className?: string;
};

export function StudioPlayerPanel({
  label,
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  showTimecode = false,
  controls = false,
  loop = true,
  inputProps,
  className,
}: StudioPlayerPanelProps) {
  const playerRef = useRef<PlayerRef>(null);
  const currentFrame = useCurrentPlayerFrame(playerRef);

  const onSeek = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame);
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(0);
    const id = window.requestAnimationFrame(() => player.play());
    return () => window.cancelAnimationFrame(id);
  }, [component, durationInFrames]);

  return (
    <StudioPanel
      label={label}
      aspectRatio={`${width} / ${height}`}
      fps={fps}
      width={width}
      height={height}
      durationInFrames={durationInFrames}
      showTimecode={showTimecode}
      currentFrame={currentFrame}
      onSeek={onSeek}
      className={className}
    >
      <Player
        ref={playerRef}
        component={component}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={width}
        compositionHeight={height}
        style={{ width: "100%", height: "100%", display: "block" }}
        inputProps={inputProps}
        controls={controls}
        loop={loop}
        autoPlay
        clickToPlay={false}
        initiallyMuted
        showPosterWhenUnplayed={false}
        acknowledgeRemotionLicense
      />
    </StudioPanel>
  );
}
