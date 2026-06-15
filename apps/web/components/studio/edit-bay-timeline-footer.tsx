"use client";

import { TimecodeBar } from "./timecode-bar";

type EditBayTimelineFooterProps = {
  durationInFrames: number;
  fps?: number;
  currentFrame: number;
  onSeek: (frame: number) => void;
  className?: string;
};

/** Full-width hero timeline with frame ruler ticks above the scrubber. */
export function EditBayTimelineFooter({
  durationInFrames,
  fps = 30,
  currentFrame,
  onSeek,
  className = "",
}: EditBayTimelineFooterProps) {
  return (
    <div
      className={`border-t border-[var(--bay-border)] bg-[var(--bay-surface)]/95 ${className}`}
    >
      <div className="frame-ruler-ticks h-4 border-b border-[var(--bay-border)] opacity-60" />
      <TimecodeBar
        durationInFrames={durationInFrames}
        fps={fps}
        currentFrame={currentFrame}
        onSeek={onSeek}
        interactive
        className="border-t-0"
      />
    </div>
  );
}
