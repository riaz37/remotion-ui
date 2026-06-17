import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springSmooth } from "./springs";

export const AI_TYPING_START = 42;
export const AI_TYPING_CPS = 22;

export function useTypedPrompt({
  prompt,
  startFrame = AI_TYPING_START,
  cps = AI_TYPING_CPS,
}: {
  prompt: string;
  startFrame?: number;
  cps?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.floor(Math.max(0, frame - startFrame) * (cps / fps));
  const text = prompt.slice(0, chars);
  return { text, count: chars, typing: chars < prompt.length };
}

export function morphProgress(frame: number, fps: number, startFrame = AI_TYPING_START) {
  const value = spring({
    fps,
    frame: frame - startFrame,
    config: { damping: 14, stiffness: 200, mass: 0.6 },
  });
  return Math.max(0, Math.min(value, 1));
}

export function introBounce(frame: number, fps: number) {
  const s = spring({ fps, frame, config: springSmooth });
  return {
    translateY: interpolate(s, [0, 1], [24, 0]),
    scale: interpolate(s, [0, 1], [0.97, 1]),
  };
}

export function fadeUp(frame: number, range: [number, number]) {
  return {
    opacity: interpolate(frame, range, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translateY: interpolate(frame, range, [12, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
}

export function stageScale(width: number, height: number, refW = 1280, refH = 720) {
  return Math.min(width / refW, height / refH);
}

export const BlockCaret: React.FC<{
  color: string;
  blink: boolean;
  height?: number;
}> = ({ color, blink, height = 22 }) => {
  const frame = useCurrentFrame();
  const opacity = blink ? (frame % 16 < 8 ? 1 : 0) : 1;
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height,
        marginLeft: 2,
        backgroundColor: color,
        opacity,
        verticalAlign: "text-bottom",
        transform: "translateY(2px)",
      }}
    />
  );
};
