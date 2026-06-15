import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type EndCardProps = {
  title: string;
  cta?: string;
  url?: string;
  logoSrc?: string;
  logoSize?: number;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#071210",
  title: "#f0fdfa",
  url: "#5eead4",
  muted: "#64748b",
  accent: "#2dd4bf",
} as const;

export const EndCard: React.FC<EndCardProps> = ({
  title,
  cta,
  url,
  logoSrc,
  logoSize,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 100%, ${accentColor}18, transparent)`,
        ...safeArea,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <ScaleIn durationInFrames={DURATION.normal}>
        <FadeIn durationInFrames={DURATION.fast}>
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: scaleFont(20, width),
              maxWidth: "88%",
            }}
          >
            {logoSrc ? (
              <Img
                src={logoSrc}
                style={{
                  width: logoSize ?? scaleFont(112, width),
                  height: logoSize ?? scaleFont(112, width),
                  borderRadius: scaleFont(24, width),
                  display: "block",
                }}
              />
            ) : null}
            <h1
              style={{
                color: COLORS.title,
                fontSize: scaleFont(logoSrc ? 52 : 84, width),
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {cta ? (
              <div
                style={{
                  backgroundColor: accentColor,
                  color: COLORS.bg,
                  fontSize: scaleFont(32, width),
                  fontWeight: 700,
                  padding: `${scaleFont(14, width)}px ${scaleFont(32, width)}px`,
                  borderRadius: 999,
                  boxShadow: `0 ${scaleFont(8, width)}px ${scaleFont(24, width)}px ${accentColor}44`,
                }}
              >
                {cta}
              </div>
            ) : null}
            {url ? (
              <p
                style={{
                  color: COLORS.url,
                  fontSize: scaleFont(28, width),
                  margin: 0,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                {url}
              </p>
            ) : null}
          </div>
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
