import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { SlideLeft } from "@/remotion/primitives/slide-left";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export type LowerThirdProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  accentColor = "#3b82f6",
  backgroundColor = "#0f172a",
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const bottomSlot = Math.max(
    safeArea.paddingBottom,
    Math.round(height * 0.13),
  );

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          background: `linear-gradient(to top, ${backgroundColor} 0%, transparent 100%)`,
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
          gap: 10,
          maxWidth: width * 0.68,
        }}
      >
        <SlideLeft durationInFrames={22} distance={40}>
          <FadeIn durationInFrames={16}>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: 6,
                  backgroundColor: accentColor,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  color: "white",
                  padding: "14px 22px",
                  fontSize: scaleFont(36, width),
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {title}
              </div>
            </div>
          </FadeIn>
        </SlideLeft>
        {subtitle ? (
          <SlideLeft durationInFrames={22} delayInFrames={8} distance={32}>
            <FadeIn durationInFrames={16} delayInFrames={8}>
              <p
                style={{
                  color: "#e2e8f0",
                  fontSize: scaleFont(28, width),
                  fontFamily: "system-ui, sans-serif",
                  margin: 0,
                  paddingLeft: 12,
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
