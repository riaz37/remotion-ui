import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const interFont = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export type AutoFitTitleProps = {
  title: string;
  subtitle?: string;
  maxFontSize?: number;
  accentColor?: string;
  backgroundColor?: string;
};

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
    fontFamily: interFont.fontFamily,
    fontWeight: "700",
  });
}

export const AutoFitTitle: React.FC<AutoFitTitleProps> = ({
  title,
  subtitle,
  maxFontSize = 96,
  accentColor = "#3b82f6",
  backgroundColor = "#0f172a",
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const maxWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const titleSize = getTitleSize(title, maxWidth, maxFontSize, width);
  const subtitleSize = Math.min(titleSize * 0.45, 48);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        textAlign: "center",
        gap: 16,
      }}
    >
      <FadeIn durationInFrames={24}>
        <h1
          style={{
            color: "white",
            fontSize: titleSize,
            fontWeight: 700,
            fontFamily: interFont.fontFamily,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
      </FadeIn>
      {subtitle ? (
        <FadeIn durationInFrames={20} delayInFrames={10}>
          <p
            style={{
              color: accentColor,
              fontSize: subtitleSize,
              fontFamily: interFont.fontFamily,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        </FadeIn>
      ) : null}
    </AbsoluteFill>
  );
};
