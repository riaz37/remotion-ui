import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type CaptionBumperProps = {
  text: string;
  eyebrow?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#09090b",
  text: "#fafafa",
  accent: "#f472b6",
} as const;

export const CaptionBumper: React.FC<CaptionBumperProps> = ({
  text,
  eyebrow,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const contentWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const contentHeight =
    height - safeArea.paddingTop - safeArea.paddingBottom;
  const isPortrait = height > width;

  const progress = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const eyebrowProgress = interpolate(
    frame,
    [0, DELAY.short + DURATION.fast * 0.5],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  const fontSize = fitHeadline({
    text,
    maxWidth: contentWidth,
    maxFontSize: scaleFont(isPortrait ? 72 : 88, width),
    minFontSize: scaleFont(36, width),
    fallbackWidth: width,
    fontFamily,
    fontWeight: "700",
  });

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        backgroundImage: `radial-gradient(circle at 12% 20%, ${accentColor}22, transparent 40%)`,
        color: COLORS.text,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: scaleFont(16, width),
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: accentColor,
            fontSize: scaleFont(26, width),
            fontWeight: 600,
            opacity: eyebrowProgress,
            transform: `translateY(${(1 - eyebrowProgress) * 12}px)`,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          opacity: progress,
          transform: `translateY(${(1 - progress) * scaleFont(24, width)}px)`,
          maxWidth: contentWidth,
          maxHeight: contentHeight * 0.75,
        }}
      >
        {text}
      </div>
    </div>
  );
};
