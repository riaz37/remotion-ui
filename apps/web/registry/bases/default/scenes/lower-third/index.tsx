import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { SlideLeft } from "@/remotion/primitives/slide-left";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type LowerThirdProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0a0c12",
  bar: "rgba(10,12,18,0.92)",
  title: "#f8fafc",
  subtitle: "#cbd5e1",
  accent: "#f43f5e",
  scrim: "rgba(10,12,18,0.88)",
} as const;

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const bottomSlot = Math.max(
    safeArea.paddingBottom,
    Math.round(height * 0.12),
  );

  const scrimColor = backgroundColor === COLORS.bg ? COLORS.scrim : `${backgroundColor}e0`;

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "40%",
          background: `linear-gradient(to top, ${scrimColor} 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safeArea.paddingLeft,
          bottom: bottomSlot,
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(10, width),
          maxWidth: width * 0.7,
          fontFamily,
        }}
      >
        <SlideLeft durationInFrames={DURATION.fast} distance={40}>
          <FadeIn durationInFrames={DURATION.fast}>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: scaleFont(6, width),
                overflow: "hidden",
                boxShadow: `0 ${scaleFont(8, width)}px ${scaleFont(24, width)}px rgba(0,0,0,0.4)`,
              }}
            >
              <div
                style={{
                  width: scaleFont(5, width),
                  backgroundColor: accentColor,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  backgroundColor: COLORS.bar,
                  color: COLORS.title,
                  padding: `${scaleFont(14, width)}px ${scaleFont(22, width)}px`,
                  fontSize: scaleFont(36, width),
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                {title}
              </div>
            </div>
          </FadeIn>
        </SlideLeft>
        {subtitle ? (
          <SlideLeft
            durationInFrames={DURATION.fast}
            delayInFrames={STAGGER.normal}
            distance={32}
          >
            <FadeIn durationInFrames={DURATION.fast} delayInFrames={STAGGER.normal}>
              <p
                style={{
                  color: COLORS.subtitle,
                  fontSize: scaleFont(28, width),
                  margin: 0,
                  paddingLeft: scaleFont(12, width),
                  fontWeight: 500,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {subtitle}
              </p>
            </FadeIn>
          </SlideLeft>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
