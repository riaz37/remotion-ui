import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type RgbGlitchTextProps = {
  text: string;
  glitchStartFrame?: number;
  glitchDurationInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const RgbGlitchText: React.FC<RgbGlitchTextProps> = ({
  text,
  glitchStartFrame = 12,
  glitchDurationInFrames = 8,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 700,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const glitchEnd = glitchStartFrame + glitchDurationInFrames;
  const inGlitch = frame >= glitchStartFrame && frame < glitchEnd;
  const jitter = inGlitch
    ? interpolate(
        frame,
        [glitchStartFrame, glitchStartFrame + glitchDurationInFrames / 2, glitchEnd],
        [0, 6, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  const baseStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    lineHeight: 1.1,
    position: "relative",
    display: "inline-block",
    ...(fontFamily ? { fontFamily } : {}),
  };

  if (!inGlitch) {
    return <span style={{ ...baseStyle, color }}>{text}</span>;
  }

  return (
    <span style={baseStyle}>
      <span
        style={{
          position: "absolute",
          left: -jitter,
          color: "#f472b6",
          opacity: 0.75,
          mixBlendMode: "screen",
        }}
      >
        {text}
      </span>
      <span
        style={{
          position: "absolute",
          left: jitter,
          color: "#2dd4bf",
          opacity: 0.75,
          mixBlendMode: "screen",
        }}
      >
        {text}
      </span>
      <span style={{ position: "relative", color }}>{text}</span>
    </span>
  );
};
