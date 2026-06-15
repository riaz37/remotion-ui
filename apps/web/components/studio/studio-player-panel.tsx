"use client";

import { Player, type PlayerRef } from "@remotion/player";
import type { ComponentType, RefObject } from "react";
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
  interactiveTimecode?: boolean;
  controls?: boolean;
  loop?: boolean;
  inputProps?: Record<string, unknown>;
  className?: string;
  /** When set, frame/seek state is owned by the parent (e.g. hero timeline footer). */
  playerRef?: RefObject<PlayerRef | null>;
};

export function StudioPlayerPanel({
  label,
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  showTimecode = false,
  interactiveTimecode = false,
  controls = false,
  loop = true,
  inputProps,
  className,
  playerRef: externalRef,
}: StudioPlayerPanelProps) {
  const internalRef = useRef<PlayerRef>(null);
  const playerRef = externalRef ?? internalRef;
  const currentFrame = useCurrentPlayerFrame(playerRef);

  const onSeek = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame);
  }, [playerRef]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(0);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const id = window.requestAnimationFrame(() => player.play());
    return () => window.cancelAnimationFrame(id);
  }, [component, durationInFrames, playerRef]);

  return (
    <StudioPanel
      label={label}
      aspectRatio={`${width} / ${height}`}
      fps={fps}
      width={width}
      height={height}
      durationInFrames={durationInFrames}
      showTimecode={showTimecode}
      interactiveTimecode={interactiveTimecode}
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
