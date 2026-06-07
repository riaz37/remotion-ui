import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { SlideLeft } from "@/remotion/primitives/slide-left";
import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { STAGGER } from "@/remotion/lib/motion-tokens";

export type FeatureListProps = {
  title?: string;
  items: string[];
  accentColor?: string;
  backgroundColor?: string;
};

export const FeatureList: React.FC<FeatureListProps> = ({
  title = "Features",
  items,
  accentColor = "#3b82f6",
  backgroundColor = "#0f172a",
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        ...safeArea,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <FadeIn durationInFrames={18}>
        <h2
          style={{
            color: "white",
            fontSize: scaleFont(64, width),
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
      </FadeIn>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <StaggerChildren staggerInFrames={STAGGER.normal}>
          {items.map((item) => (
            <SlideLeft key={item} durationInFrames={22} distance={48}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: accentColor,
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${accentColor}88`,
                  }}
                />
                <span
                  style={{
                    color: "#e2e8f0",
                    fontSize: scaleFont(44, width),
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1.3,
                  }}
                >
                  {item}
                </span>
              </div>
            </SlideLeft>
          ))}
        </StaggerChildren>
      </div>
    </AbsoluteFill>
  );
};
