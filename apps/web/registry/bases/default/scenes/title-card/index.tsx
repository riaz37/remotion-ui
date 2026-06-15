import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#fafafa",
  subtitle: "#71717a",
  accent: "#6366f1",
  glow: "rgba(99,102,241,0.22)",
} as const;

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "52%",
          height: "52%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow} 0%, transparent 72%)`,
          filter: `blur(${scaleFont(48, width)}px)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 60%, ${accentColor}12 100%)`,
          pointerEvents: "none",
        }}
      />
      <ScaleIn durationInFrames={DURATION.normal}>
        <FadeIn durationInFrames={DURATION.fast}>
          <div
            style={{
              textAlign: "center",
              position: "relative",
              maxWidth: "88%",
            }}
          >
            <h1
              style={{
                color: COLORS.title,
                fontSize: scaleFont(84, width),
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{
                  color: COLORS.subtitle,
                  fontSize: scaleFont(36, width),
                  marginTop: scaleFont(20, width),
                  marginBottom: 0,
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
