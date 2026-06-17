"use client";

import type { PlayerRef } from "@remotion/player";
import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import { ScaledPlayerStage } from "@/components/studio/scaled-player-stage";

type SceneMonitorPreviewProps = {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  previewWidth: number;
  previewHeight: number;
  inputProps?: Record<string, unknown>;
};

export function SceneMonitorPreview({
  name,
  component,
  durationInFrames,
  previewWidth,
  previewHeight,
  inputProps = {},
}: SceneMonitorPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const meta = `30fps · ${previewWidth}×${previewHeight}`;

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
  }, [component, durationInFrames, inputProps]);

  return (
    <div className="not-prose overflow-hidden rounded-md border border-[var(--bay-border-strong)] bg-[var(--bay-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--bay-border)] px-4 py-2">
        <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] font-medium text-fd-foreground">
          {name}
        </span>
        <span className="text-mono-xs text-fd-muted-foreground">{meta}</span>
      </div>
      <ScaledPlayerStage
        playerRef={playerRef}
        component={component}
        durationInFrames={durationInFrames}
        fps={30}
        width={previewWidth}
        height={previewHeight}
        inputProps={inputProps}
      />
    </div>
  );
}
