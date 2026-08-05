"use client";

import type { PlayerRef } from "@remotion/player";
import {
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { formatTimecode } from "@/components/studio/timecode-bar";

type ProgramScrubBarProps = {
  playerRef: RefObject<PlayerRef | null>;
  frame: MotionValue<number>;
  durationInFrames: number;
  fps: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * The hero's bottom edge is a working scrubber, not a decoration.
 *
 * Everything continuous here runs on MotionValues: the playhead translates, the
 * played line scales, and the timecode readout is written straight to the DOM.
 * Nothing in this component re-renders while the loop plays.
 *
 * It also gives the stage a hard bottom edge, which is what carries the page
 * from the black hero into the light section underneath it.
 */
export function ProgramScrubBar({
  playerRef,
  frame,
  durationInFrames,
  fps,
}: ProgramScrubBarProps) {
  const lastFrame = Math.max(1, durationInFrames - 1);
  const trackRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const resumeAfterScrub = useRef(false);
  const printed = useRef("");

  const playheadX = useTransform(
    frame,
    (value) => `${clamp01(value / lastFrame) * 100}%`,
  );
  const playedScale = useTransform(frame, (value) => clamp01(value / lastFrame));

  // Timecode readout: one DOM write per changed second-frame, no React render.
  useMotionValueEvent(frame, "change", (value) => {
    const next = formatTimecode(value, fps);
    if (next === printed.current) return;
    printed.current = next;
    if (readoutRef.current) readoutRef.current.textContent = next;
    trackRef.current?.setAttribute("aria-valuenow", String(Math.round(value)));
    trackRef.current?.setAttribute("aria-valuetext", next);
  });

  const seekTo = useCallback(
    (nextFrame: number) => {
      playerRef.current?.seekTo(
        Math.min(lastFrame, Math.max(0, Math.round(nextFrame))),
      );
    },
    [playerRef, lastFrame],
  );

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      seekTo(clamp01((clientX - rect.left) / rect.width) * lastFrame);
    },
    [seekTo, lastFrame],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const player = playerRef.current;
    // Scrubbing pauses transport, the way dragging a playhead does in an NLE.
    resumeAfterScrub.current = player?.isPlaying() ?? false;
    player?.pause();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.scrubbing = "true";
    seekFromPointer(event.clientX);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    seekFromPointer(event.clientX);
  };

  const endScrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    delete event.currentTarget.dataset.scrubbing;
    if (resumeAfterScrub.current) playerRef.current?.play();
    resumeAfterScrub.current = false;
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player) return;
    const current = player.getCurrentFrame();
    const step = event.shiftKey ? fps : 1;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        player.pause();
        seekTo(current - step);
        break;
      case "ArrowRight":
        event.preventDefault();
        player.pause();
        seekTo(current + step);
        break;
      case "Home":
        event.preventDefault();
        player.pause();
        seekTo(0);
        break;
      case "End":
        event.preventDefault();
        player.pause();
        seekTo(lastFrame);
        break;
      // Stepping frames pauses transport, so the keyboard needs a way back.
      case " ":
      case "Enter":
        event.preventDefault();
        player.toggle();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative z-10 border-t border-[var(--bay-border)] bg-[var(--bay-surface)]">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-6 py-1.5">
        <span
          ref={readoutRef}
          className="text-mono-xs w-[8ch] shrink-0 text-fd-muted-foreground"
        >
          {formatTimecode(0, fps)}
        </span>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Seek the hero composition. Space plays and pauses."
          aria-valuemin={0}
          aria-valuemax={lastFrame}
          aria-valuenow={0}
          aria-valuetext={formatTimecode(0, fps)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onKeyDown={onKeyDown}
          className="group relative h-11 flex-1 cursor-ew-resize touch-none rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-[var(--bay-phosphor)]"
        >
          <div
            className="program-ruler absolute inset-x-0 top-[12px] h-2 opacity-45 transition-opacity duration-200 group-hover:opacity-80 group-data-[scrubbing]:opacity-100"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-[22px] h-px bg-[var(--bay-border-strong)]"
            aria-hidden
          />
          <motion.div
            style={{ scaleX: playedScale }}
            className="absolute inset-x-0 top-[22px] h-px origin-left bg-[var(--bay-phosphor)] opacity-70"
            aria-hidden
          />
          <motion.div
            style={{ x: playheadX }}
            className="pointer-events-none absolute inset-y-2 left-0 w-full"
            aria-hidden
          >
            <span className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-[var(--bay-phosphor)] transition-transform duration-150 group-hover:scale-x-[2] group-data-[scrubbing]:scale-x-[2]" />
          </motion.div>
        </div>

        <span className="text-mono-xs w-[8ch] shrink-0 text-right text-fd-muted-foreground">
          {formatTimecode(durationInFrames, fps)}
        </span>
      </div>
    </div>
  );
}
