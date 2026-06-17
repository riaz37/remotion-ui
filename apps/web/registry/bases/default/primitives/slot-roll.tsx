import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type SlotRollProps = {
  from: string;
  to: string;
  durationInFrames?: number;
  delayInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function rollChar(from: string, to: string, progress: number, seed: number): string {
  if (progress >= 1) return to;
  if (progress <= 0) return from;
  if (from === to) return to;
  const idx = Math.floor(
    interpolate(progress, [0, 0.85, 1], [0, CHARSET.length - 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
      seed * 3,
  );
  return CHARSET[Math.abs(idx) % CHARSET.length] ?? to;
}

export const SlotRoll: React.FC<SlotRollProps> = ({
  from,
  to,
  durationInFrames = 40,
  delayInFrames = 0,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 700,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);
  const progress = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    {
      easing: EASING_ENTER,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const len = Math.max(from.length, to.length);
  const paddedFrom = from.padStart(len, " ");
  const paddedTo = to.padStart(len, " ");
  const display = Array.from({ length: len }, (_, i) =>
    rollChar(paddedFrom[i] ?? " ", paddedTo[i] ?? " ", progress, i),
  ).join("");

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {display.trimStart()}
    </span>
  );
};
