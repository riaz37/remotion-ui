import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type StrikethroughReplaceProps = {
  from: string;
  to: string;
  strikeDurationInFrames?: number;
  replaceDelayInFrames?: number;
  replaceDurationInFrames?: number;
  fontSize?: number;
  color?: string;
  strikeColor?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const StrikethroughReplace: React.FC<StrikethroughReplaceProps> = ({
  from,
  to,
  strikeDurationInFrames = 18,
  replaceDelayInFrames = 20,
  replaceDurationInFrames = 16,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  strikeColor = "#f472b6",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const strikeProgress = interpolate(frame, [0, strikeDurationInFrames], [0, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replaceOpacity = interpolate(
    frame,
    [replaceDelayInFrames, replaceDelayInFrames + replaceDurationInFrames],
    [0, 1],
    {
      easing: EASING_ENTER,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const fromOpacity = 1 - replaceOpacity;
  const showStrike = frame < replaceDelayInFrames + 4;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontSize,
        fontWeight,
        lineHeight: 1.2,
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      <span style={{ opacity: fromOpacity, color }}>{from}</span>
      {showStrike ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "52%",
            height: 3,
            transform: `scaleX(${strikeProgress})`,
            transformOrigin: "left center",
            backgroundColor: strikeColor,
            borderRadius: 2,
          }}
        />
      ) : null}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: replaceOpacity,
          color,
        }}
      >
        {to}
      </span>
    </span>
  );
};
