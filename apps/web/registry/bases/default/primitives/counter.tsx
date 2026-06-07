import { interpolate, useCurrentFrame } from "remotion";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type CounterProps = {
  from?: number;
  to: number;
  durationInFrames?: number;
  delayInFrames?: number;
  suffix?: string;
  style?: React.CSSProperties;
};

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  durationInFrames = 60,
  delayInFrames = 0,
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();

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
        fontFamily: "system-ui, sans-serif",
        fontSize: 72,
        fontWeight: 700,
        color: "white",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {value}
      {suffix}
    </span>
  );
};
