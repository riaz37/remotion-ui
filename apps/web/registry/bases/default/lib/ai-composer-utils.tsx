import type { CSSProperties } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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

export interface SendBeat {
  /** Speed-adjusted frame the send happens on. */
  frame: number;
  /** True once the prompt has left the composer. */
  sent: boolean;
  /** 0 → 1 → 0 pulse across the button press. Map it onto a scale dip. */
  press: number;
  /** 0 → 1 as the sent message rises into the thread. */
  bubble: number;
  /** 0 → 1 as the assistant starts working on the reply. */
  reply: number;
}

/**
 * The beat after the typewriter stops: press, clear, and the prompt landing in
 * the thread. Timed off the prompt length so it always follows the last
 * character rather than sitting on a hand-picked frame that a longer prompt
 * would overrun.
 *
 * `frame` must already be speed-adjusted (`frame * speed`), the same value the
 * typewriter is driven with.
 */
export function sendBeatAt(
  frame: number,
  opts: {
    promptLength: number;
    fps: number;
    cps?: number;
    startFrame?: number;
    /** Beat between the last character and the press. */
    pauseSeconds?: number;
  },
): SendBeat {
  const {
    promptLength,
    fps,
    cps = AI_TYPING_CPS,
    startFrame = AI_TYPING_START,
    pauseSeconds = 0.34,
  } = opts;
  const clampBoth = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const at =
    startFrame + (cps > 0 ? (promptLength / cps) * fps : 0) + pauseSeconds * fps;

  return {
    frame: at,
    sent: frame >= at,
    press: interpolate(frame, [at - 4, at, at + 8], [0, 1, 0], clampBoth),
    bubble: interpolate(frame, [at + 1, at + 15], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clampBoth,
    }),
    reply: interpolate(frame, [at + 10, at + 22], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clampBoth,
    }),
  };
}

/**
 * Three-dot "working on it" pulse. `index` is the dot, `frame` the
 * speed-adjusted frame; the period is deliberately short so a preview sampled
 * late in its window still has something moving in it.
 */
export function replyDotOpacity(
  frame: number,
  index: number,
  fps: number,
): number {
  const period = fps * 0.9;
  const phase = ((frame - index * (period / 3)) % period + period) % period;
  return 0.28 + 0.72 * (0.5 - 0.5 * Math.cos((phase / period) * Math.PI * 2));
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
    scale: interpolate(s, [0, 1], [0.97, 1], { output: "perceptual-scale" }),
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
