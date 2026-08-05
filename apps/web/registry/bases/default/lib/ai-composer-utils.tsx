import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Frame the prompt starts typing in the chat-style composers. */
export const AI_TYPING_START = 42;
/** Frame the prompt starts typing in the terminal-style composers. */
export const AI_TYPING_START_TUI = 48;
/** Characters per second for the chat-style composers. */
export const AI_TYPING_CPS = 22;

export function stageScale(
  width: number,
  height: number,
  refW = 1280,
  refH = 720,
): number {
  return Math.min(width / refW, height / refH);
}

export interface TypewriterOptions {
  cps?: number;
  speed?: number;
  startFrame?: number;
}

export interface TypewriterState {
  text: string;
  count: number;
  done: boolean;
  typing: boolean;
}

/**
 * Character-by-character reveal. `typing` is false both before the first
 * character and after the last one, so a caret bound to `!typing` blinks while
 * idle and holds solid while text is being revealed.
 */
export function useTypewriter(
  full: string,
  options: TypewriterOptions = {},
): TypewriterState {
  const {
    cps = AI_TYPING_CPS,
    speed = 1,
    startFrame = AI_TYPING_START,
  } = options;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame * speed - startFrame;
  const over = (full.length / cps) * fps;
  const count =
    local <= 0
      ? 0
      : over <= 0
        ? full.length
        : Math.max(0, Math.min(full.length, Math.floor((local / over) * full.length)));

  return {
    text: full.slice(0, count),
    count,
    done: count >= full.length,
    typing: count > 0 && count < full.length,
  };
}

/** Spring that drives the mic/waveform → send button morph. */
export function morphProgressAt(
  frame: number,
  opts: { startFrame?: number; fps: number; speed?: number },
): number {
  const { startFrame = AI_TYPING_START, fps, speed = 1 } = opts;
  const value = spring({
    fps,
    frame: frame * speed - startFrame,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  return Math.max(0, Math.min(value, 1));
}

export function introBounceIn(
  frame: number,
  fps: number,
): { translateY: number; scale: number } {
  const s = spring({
    fps,
    frame,
    config: { damping: 14, stiffness: 110, mass: 0.7 },
  });
  return {
    translateY: interpolate(s, [0, 1], [28, 0]),
    scale: interpolate(s, [0, 1], [0.97, 1]),
  };
}

export function fadeUpAt(
  frame: number,
  range: [number, number],
): { opacity: number; translateY: number } {
  const opts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  return {
    opacity: interpolate(frame, range, [0, 1], opts),
    translateY: interpolate(frame, range, [12, 0], opts),
  };
}

export function caretBlinkOpacity(
  frame: number,
  opts: { fps: number; blinkPerSecond: number; speed: number },
): number {
  const cycles = opts.blinkPerSecond <= 0 ? 1 : opts.blinkPerSecond;
  const halfPeriod = opts.fps / cycles / 2;
  if (halfPeriod <= 0) return 1;
  return Math.floor((frame * opts.speed) / halfPeriod) % 2 === 0 ? 1 : 0;
}

export interface CaretProps {
  color?: string;
  width?: number;
  height?: number;
  radius?: number;
  opacity?: number;
  blink?: boolean;
  blinkPerSecond?: number;
  speed?: number;
  marginLeft?: number;
  style?: CSSProperties;
}

export function Caret({
  color = "currentColor",
  width = 2,
  height = 18,
  radius = 1,
  opacity,
  blink = false,
  blinkPerSecond = 1,
  speed = 1,
  marginLeft = 0,
  style,
}: CaretProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resolvedOpacity =
    opacity !== undefined
      ? opacity
      : blink
        ? caretBlinkOpacity(frame, { fps, blinkPerSecond, speed })
        : 1;

  return (
    <span
      style={{
        display: "inline-block",
        flexShrink: 0,
        width,
        height,
        borderRadius: radius,
        background: color,
        opacity: resolvedOpacity,
        marginLeft,
        ...style,
      }}
    />
  );
}
