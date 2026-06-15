import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { AudiogramBars } from "@/remotion/primitives/audiogram-bars";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
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
  bg: "#0a0812",
  title: "#faf5ff",
  subtitle: "#c4b5fd",
  glow: "rgba(124,58,237,0.2)",
  accent: "#7c3aed",
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
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const hasHeader = Boolean(title || subtitle || logoSrc);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse 90% 55% at 50% 0%, ${COLORS.glow}, transparent)`,
        ...safeArea,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
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
              gap: logoSrc ? scaleFont(20, width) : 0,
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
                  fontWeight: 800,
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
      <FadeIn durationInFrames={DURATION.normal} delayInFrames={8}>
        <AudiogramBars
          src={src}
          barColor={accentColor}
          height={Math.round(height * 0.18)}
        />
      </FadeIn>
    </AbsoluteFill>
  );
};
