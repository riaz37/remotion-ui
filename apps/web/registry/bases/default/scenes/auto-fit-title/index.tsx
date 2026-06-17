import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";
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
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const maxWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const titleSize = getTitleSize(title, maxWidth, maxFontSize, width);
  const subtitleSize = Math.min(scaleFont(40, width), titleSize * 0.42);

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
      }}
    >
      {logoSrc ? (
        <FadeIn durationInFrames={DURATION.fast}>
          <Img
            src={logoSrc}
            style={{
              width: logoSize ?? scaleFont(96, width),
              height: logoSize ?? scaleFont(96, width),
              borderRadius: scaleFont(20, width),
            }}
          />
        </FadeIn>
      ) : null}
      <FadeIn durationInFrames={DURATION.normal}>
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
          }}
        >
          {title}
        </h1>
      </FadeIn>
      {subtitle ? (
        <FadeIn durationInFrames={DURATION.fast} delayInFrames={10}>
          <p
            style={{
              color: accentColor,
              fontSize: subtitleSize,
              margin: 0,
              fontWeight: 600,
              maxWidth,
              overflowWrap: "break-word",
            }}
          >
            {subtitle}
          </p>
        </FadeIn>
      ) : null}
    </AbsoluteFill>
  );
};
