import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type BlurFocusInProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  maxBlur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const BlurFocusIn: React.FC<BlurFocusInProps> = ({
  text,
  durationInFrames = 36,
  delayInFrames = 0,
  maxBlur = 18,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
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
  const blur = interpolate(progress, [0, 1], [maxBlur, 0]);
  const opacity = interpolate(progress, [0, 0.35, 1], [0, 0.72, 1]);

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.15,
        opacity,
        filter: `blur(${blur}px)`,
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {text}
    </span>
  );
};
