import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type CounterProps = {
  from?: number;
  to: number;
  durationInFrames?: number;
  delayInFrames?: number;
  suffix?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
};

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  durationInFrames = 60,
  delayInFrames = 0,
  suffix = "",
  fontSize: fontSizeProp,
  color,
  fontFamily,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);

  const value = Math.floor(
    interpolate(
      frame,
      [delayInFrames, delayInFrames + durationInFrames],
      [from, to],
      {
        easing: EASING_ENTER,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );

  return (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        ...(color !== undefined ? { color } : {}),
        ...(fontFamily !== undefined ? { fontFamily } : {}),
        ...style,
      }}
    >
      {value}
      {suffix}
    </span>
  );
};
