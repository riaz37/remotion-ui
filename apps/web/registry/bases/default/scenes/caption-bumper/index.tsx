import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "800", "900"],
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
  const progress = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = fitHeadline({
    text,
    maxWidth: contentWidth,
    maxFontSize: scaleFont(88, width),
    minFontSize: scaleFont(42, width),
    fallbackWidth: width,
    fontFamily,
    fontWeight: "900",
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
        gap: scaleFont(20, width),
        fontFamily,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: accentColor,
            fontSize: scaleFont(28, width),
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: progress,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontSize,
          fontWeight: 900,
          lineHeight: 1.04,
          letterSpacing: "-0.02em",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
          maxWidth: contentWidth,
        }}
      >
        {text}
      </div>
    </div>
  );
};
