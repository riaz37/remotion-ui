import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type MatrixDecodeProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

const GLYPHS = "アイウエオカキクケコサシスセソ0123456789";

function scrambleChar(target: string, progress: number, index: number): string {
  if (progress >= 1) return target;
  const resolved = Math.floor(progress * target.length);
  if (index < resolved) return target[index] ?? "";
  const seed = (index * 17 + Math.floor(progress * 40)) % GLYPHS.length;
  return GLYPHS[seed] ?? target;
}

export const MatrixDecode: React.FC<MatrixDecodeProps> = ({
  text,
  durationInFrames = 50,
  delayInFrames = 0,
  fontSize: fontSizeProp,
  color = "#2dd4bf",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const progress = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const decoded = Array.from(text, (char, index) =>
    char === " " ? " " : scrambleChar(char, progress, index),
  ).join("");

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        fontFamily: fontFamily ?? "ui-monospace, monospace",
      }}
    >
      {decoded}
    </span>
  );
};
