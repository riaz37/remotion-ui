"use client";

import type { PlayerRef } from "@remotion/player";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef } from "react";
import { CodeSnippet } from "@/components/docs/code-snippet";
import { useCurrentPlayerFrame } from "@/lib/use-current-player-frame";
import { ScaledPlayerStage } from "./scaled-player-stage";
import { TimecodeBar } from "./timecode-bar";

export type InspectorField = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type ProgramMonitorWorkspaceProps = {
  label: string;
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps?: number;
  width: number;
  height: number;
  inputProps: Record<string, unknown>;
  fields: InspectorField[];
  usageSnippet?: string;
};

export function ProgramMonitorWorkspace({
  label,
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  inputProps,
  fields,
  usageSnippet,
}: ProgramMonitorWorkspaceProps) {
  const playerRef = useRef<PlayerRef>(null);
  const currentFrame = useCurrentPlayerFrame(playerRef);

  const onSeek = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame);
  }, []);

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

  const meta = `${fps}fps · ${width}×${height}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex flex-col overflow-hidden rounded-lg border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] lg:flex-row lg:items-stretch">
        <aside className="relative shrink-0 px-5 py-5 lg:w-[280px] lg:border-r lg:border-[var(--bay-border)]">
          <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground">
            Inspector
          </p>
          <div className="mt-4 grid gap-4">
            {fields.map((field) => (
              <label key={field.name} className="grid gap-1.5">
                <span className="text-sm font-medium text-fd-foreground">
                  {field.name}
                </span>
                <input
                  type="text"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder={field.placeholder}
                  className="border-b border-[var(--bay-border)] bg-transparent px-0 py-2 font-[family-name:var(--font-mono)] text-sm text-fd-foreground outline-none focus:border-[var(--bay-phosphor)]"
                />
              </label>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--bay-border)] px-4 py-2 lg:border-t-0">
            <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] font-medium text-fd-foreground">
              {label}
            </span>
            <span className="text-mono-xs text-fd-muted-foreground">{meta}</span>
          </div>
          <ScaledPlayerStage
            playerRef={playerRef}
            component={component}
            durationInFrames={durationInFrames}
            fps={fps}
            width={width}
            height={height}
            inputProps={inputProps}
          />
          <TimecodeBar
            durationInFrames={durationInFrames}
            fps={fps}
            currentFrame={currentFrame}
            onSeek={onSeek}
            interactive
          />
        </div>
      </div>

      {usageSnippet ? (
        <CodeSnippet label="Export snippet" code={usageSnippet} />
      ) : null}
    </div>
  );
}
