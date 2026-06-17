import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type AutoFitTitleProps = {
  title: string;
  subtitle?: string;
  logoSrc?: string;
  logoSize?: number;
  maxFontSize?: number;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#fafafa",
  accent: "#e8b86d",
} as const;

function getTitleSize(
  title: string,
  maxWidth: number,
  maxFontSize: number,
  fallbackWidth: number,
) {
  return fitHeadline({
    text: title,
    maxWidth,
    maxFontSize: Math.min(maxFontSize, scaleFont(96, fallbackWidth)),
    minFontSize: scaleFont(42, fallbackWidth),
    fontFamily,
    fontWeight: "700",
  });
}

export const AutoFitTitle: React.FC<AutoFitTitleProps> = ({
  title,
  subtitle,
  logoSrc,
  logoSize,
  maxFontSize = 96,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const maxWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const titleSize = getTitleSize(title, maxWidth, maxFontSize, width);
  const subtitleSize = Math.min(scaleFont(40, width), titleSize * 0.42);
  const logoEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleEnter = interpolate(
    frame,
    [DELAY.short, DELAY.short + DURATION.normal],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const subtitleEnter = interpolate(
    frame,
    [DELAY.medium, DELAY.medium + DURATION.fast],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 30%, ${accentColor}18, transparent 50%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        textAlign: "center",
        gap: scaleFont(16, width),
        fontFamily,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 90% 28% at 50% 0%, ${accentColor}14, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {logoSrc ? (
        <Img
          src={logoSrc}
          style={{
            width: logoSize ?? scaleFont(96, width),
            height: logoSize ?? scaleFont(96, width),
            borderRadius: scaleFont(20, width),
            opacity: logoEnter,
            transform: `scale(${0.9 + logoEnter * 0.1})`,
          }}
        />
      ) : null}
      <h1
        style={{
          color: COLORS.title,
          fontSize: titleSize,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          maxWidth,
          overflowWrap: "break-word",
          wordBreak: "break-word",
          opacity: titleEnter,
          transform: `translateY(${(1 - titleEnter) * scaleFont(20, width)}px)`,
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          style={{
            color: accentColor,
            fontSize: subtitleSize,
            margin: 0,
            fontWeight: 600,
            maxWidth,
            overflowWrap: "break-word",
            opacity: subtitleEnter,
            transform: `translateY(${(1 - subtitleEnter) * scaleFont(12, width)}px)`,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </AbsoluteFill>
  );
};
