import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

export type CaptionBumperProps = {
  text: string;
  eyebrow?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const CaptionBumper: React.FC<CaptionBumperProps> = ({
  text,
  eyebrow = "Key moment",
  backgroundColor = "#020617",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.1 });
  const progress = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = fitHeadline({
    text,
    maxWidth: width - padding * 2,
    maxFontSize: Math.round(width * 0.09),
    fallbackWidth: width,
  });

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        color: "white",
        padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 20,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ color: accentColor, fontSize: 34, fontWeight: 800, opacity: progress }}>
        {eyebrow}
      </div>
      <div
        style={{
          fontSize,
          fontWeight: 900,
          lineHeight: 1.04,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 28}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
