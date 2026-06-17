import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, staggerDelay } from "@/remotion/lib/timing";

export type StaggeredFadeUpProps = {
  text: string;
  staggerInFrames?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const StaggeredFadeUp: React.FC<StaggeredFadeUpProps> = ({
  text,
  staggerInFrames = 4,
  durationInFrames = 16,
  delayInFrames = 0,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: "0.28em",
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {words.map((word, index) => {
        const start = staggerDelay(index, staggerInFrames, delayInFrames);
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          {
            easing: EASING_ENTER,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const y = interpolate(progress, [0, 1], [18, 0]);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              opacity: progress,
              transform: `translateY(${y}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
