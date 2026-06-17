import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { AudiogramBars } from "@/remotion/primitives/audiogram-bars";
import { FadeIn } from "@/remotion/primitives/fade-in";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export type AudiogramSceneProps = {
  src: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  logoSize?: number;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#fafafa",
  subtitle: "#d4d4d8",
  glow: "rgba(232,184,109,0.16)",
  accent: "#e8b86d",
} as const;

export const AudiogramScene: React.FC<AudiogramSceneProps> = ({
  src,
  title,
  subtitle,
  logoSrc,
  logoSize,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const hasHeader = Boolean(title || subtitle || logoSrc);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse 90% 55% at 50% 0%, ${COLORS.glow}, transparent)`,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom + scaleFont(28, width),
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: scaleFont(36, width),
        fontFamily,
      }}
    >
      {hasHeader ? (
        <FadeIn durationInFrames={DURATION.fast}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: logoSrc ? "center" : "flex-start",
              textAlign: logoSrc ? "center" : "left",
              gap: scaleFont(12, width),
            }}
          >
            {logoSrc ? (
              <Img
                src={logoSrc}
                style={{
                  width: logoSize ?? scaleFont(80, width),
                  height: logoSize ?? scaleFont(80, width),
                  borderRadius: scaleFont(18, width),
                }}
              />
            ) : null}
            {title ? (
              <h1
                style={{
                  color: COLORS.title,
                  fontSize: scaleFont(64, width),
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p
                style={{
                  color: COLORS.subtitle,
                  fontSize: scaleFont(32, width),
                  margin: title ? `${scaleFont(10, width)}px 0 0` : 0,
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </FadeIn>
      ) : null}
      <FadeIn durationInFrames={DURATION.normal} delayInFrames={10}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            paddingBottom: scaleFont(18, width),
          }}
        >
          <AudiogramBars
            src={src}
            frame={frame}
            barColor={accentColor}
            height={Math.round(height * 0.14)}
          />
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
