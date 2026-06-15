"use client";

import type { KeyboardEvent, MouseEvent } from "react";

type TimecodeBarProps = {
  durationInFrames: number;
  fps?: number;
  currentFrame?: number;
  onSeek?: (frame: number) => void;
  markers?: number[];
  interactive?: boolean;
  className?: string;
};

function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor(frame % fps);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function TimecodeBar({
  durationInFrames,
  fps = 30,
  currentFrame = 0,
  onSeek,
  markers = [],
  interactive = false,
  className = "",
}: TimecodeBarProps) {
  const progress =
    durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;

  const seekFromClientX = (clientX: number, target: HTMLElement) => {
    if (!onSeek || durationInFrames <= 0) return;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * (durationInFrames - 1)));
  };

  const onTrackKeyDown = (event: KeyboardEvent) => {
    if (!interactive || !onSeek) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSeek(Math.max(0, currentFrame - 1));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onSeek(Math.min(durationInFrames - 1, currentFrame + 1));
    }
    if (event.key === "Home") {
      event.preventDefault();
      onSeek(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      onSeek(durationInFrames - 1);
    }
  };

  const trackProps = interactive
    ? {
        role: "slider" as const,
        tabIndex: 0,
        "aria-valuemin": 0,
        "aria-valuemax": durationInFrames - 1,
        "aria-valuenow": currentFrame,
        "aria-label": "Timeline playhead",
        onKeyDown: onTrackKeyDown,
        onClick: (event: MouseEvent<HTMLDivElement>) => {
          seekFromClientX(event.clientX, event.currentTarget);
        },
      }
    : {};

  return (
    <div className={`border-t border-[var(--bay-border)] px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3 text-mono-xs text-fd-muted-foreground">
        <span className="tabular-nums">{formatTimecode(currentFrame, fps)}</span>
        <div
          className={`relative h-px flex-1 bg-[var(--bay-border-strong)] ${interactive ? "cursor-pointer py-3 -my-3" : ""}`}
          {...trackProps}
        >
          <span
            className="pointer-events-none absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bay-phosphor)]"
            style={{ left: `${progress}%` }}
            aria-hidden
          />
          {markers.map((frame) => {
            const left = (frame / durationInFrames) * 100;
            return (
              <button
                key={frame}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSeek?.(frame);
                }}
                className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fd-muted-foreground/50 transition-colors hover:bg-[var(--bay-phosphor)]"
                style={{ left: `${left}%` }}
                aria-label={`Go to frame ${frame}`}
              />
            );
          })}
        </div>
        <span className="tabular-nums">
          {formatTimecode(durationInFrames, fps)}
        </span>
      </div>
    </div>
  );
}
