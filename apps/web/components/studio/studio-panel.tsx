import type { ReactNode } from "react";
import { TimecodeBar } from "./timecode-bar";

type StudioPanelProps = {
  label: string;
  aspectRatio?: string;
  fps?: number;
  width?: number;
  height?: number;
  durationInFrames?: number;
  showTimecode?: boolean;
  interactiveTimecode?: boolean;
  currentFrame?: number;
  onSeek?: (frame: number) => void;
  markers?: number[];
  children: ReactNode;
  className?: string;
};

export function StudioPanel({
  label,
  aspectRatio = "16 / 9",
  fps = 30,
  width,
  height,
  durationInFrames,
  showTimecode = false,
  interactiveTimecode = false,
  currentFrame,
  onSeek,
  markers,
  children,
  className = "",
}: StudioPanelProps) {
  const meta =
    width && height ? `${fps}fps · ${width}×${height}` : `${fps}fps`;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--bay-border)] px-4 py-2">
        <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] font-medium text-fd-foreground">
          {label}
        </span>
        <span className="text-mono-xs text-fd-muted-foreground">{meta}</span>
      </div>
      <div
        className="w-full bg-[var(--bay-stage)]"
        style={{ aspectRatio }}
      >
        {children}
      </div>
      {showTimecode && durationInFrames ? (
        <TimecodeBar
          durationInFrames={durationInFrames}
          fps={fps}
          currentFrame={currentFrame}
          onSeek={onSeek}
          markers={markers}
          interactive={interactiveTimecode}
        />
      ) : null}
    </div>
  );
}
