"use client";

type TimecodeBarProps = {
  durationInFrames: number;
  fps?: number;
  currentFrame?: number;
  onSeek?: (frame: number) => void;
  markers?: number[];
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
}: TimecodeBarProps) {
  const progress =
    durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;

  return (
    <div className="border-t border-[var(--bay-border)] px-4 py-2.5">
      <div className="flex items-center gap-3 text-mono-xs text-fd-muted-foreground">
        <span className="tabular-nums">{formatTimecode(currentFrame, fps)}</span>
        <div className="relative h-px flex-1 bg-[var(--bay-border-strong)]">
          <span
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bay-phosphor)]"
            style={{ left: `${progress}%` }}
            aria-hidden
          />
          {markers.map((frame) => {
            const left = (frame / durationInFrames) * 100;
            return (
              <button
                key={frame}
                type="button"
                onClick={() => onSeek?.(frame)}
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
