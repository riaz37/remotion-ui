import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { springSmooth } from "@/remotion/lib/springs";

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
  const { width, fps } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);

  const progress = spring({
    fps,
    frame,
    config: springSmooth,
    delay: delayInFrames,
    durationInFrames,
  });
  const value = Math.floor(interpolate(progress, [0, 1], [from, to]));

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
