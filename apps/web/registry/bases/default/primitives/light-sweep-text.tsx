import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type LightSweepTextProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  baseColor?: string;
  shineColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
};

export const LightSweepText: React.FC<LightSweepTextProps> = ({
  text,
  durationInFrames = 48,
  delayInFrames = 0,
  baseColor = "#71717a",
  shineColor = "#fafafa",
  fontSize: fontSizeProp,
  fontWeight = 700,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const sweep = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [120, -20],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        lineHeight: 1.1,
        backgroundImage: `linear-gradient(105deg, ${baseColor} 0%, ${baseColor} 42%, ${shineColor} 50%, ${baseColor} 58%, ${baseColor} 100%)`,
        backgroundSize: "220% 100%",
        backgroundPosition: `${sweep}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {text}
    </span>
  );
};
