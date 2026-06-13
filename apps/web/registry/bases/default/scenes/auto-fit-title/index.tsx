import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, useVideoConfig } from "remotion";
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
  logoSrc?: string;
  logoSize?: number;
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
  logoSrc,
  logoSize,
  maxFontSize = 96,
  accentColor = "#60a5fa",
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
      {logoSrc ? (
        <FadeIn durationInFrames={18}>
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
