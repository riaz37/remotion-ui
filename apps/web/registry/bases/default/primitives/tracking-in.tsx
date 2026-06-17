import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { springSmooth } from "@/remotion/lib/springs";

export type TrackingInProps = {
  text: string;
  durationInFrames?: number;
  delayInFrames?: number;
  fromTracking?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const TrackingIn: React.FC<TrackingInProps> = ({
  text,
  durationInFrames = 28,
  delayInFrames = 0,
  fromTracking = 0.28,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const progress = spring({
    fps,
    frame,
    config: springSmooth,
    delay: delayInFrames,
    durationInFrames,
  });
  const letterSpacing = `${fromTracking * (1 - progress)}em`;
  const blur = (1 - progress) * 6;
  const opacity = Math.min(1, progress * 1.15);

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.15,
        letterSpacing,
        opacity,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      {text}
    </span>
  );
};
