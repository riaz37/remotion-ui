import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { SlideLeft } from "@/remotion/primitives/slide-left";
import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type FeatureListProps = {
  title?: string;
  items: string[];
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0c0f14",
  text: "#f4f4f5",
  item: "#d4d4d8",
  accent: "#f59e0b",
} as const;

export const FeatureList: React.FC<FeatureListProps> = ({
  title,
  items,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
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
        gap: scaleFont(36, width),
        fontFamily,
      }}
    >
      {title ? (
        <FadeIn durationInFrames={DURATION.fast}>
          <h2
            style={{
              color: COLORS.text,
              fontSize: scaleFont(84, width),
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
        </FadeIn>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(22, width),
        }}
      >
        <StaggerChildren staggerInFrames={STAGGER.normal}>
          {items.map((item) => (
            <SlideLeft key={item} durationInFrames={DURATION.fast} distance={48}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: scaleFont(18, width),
                }}
              >
                <div
                  style={{
                    width: scaleFont(14, width),
                    height: scaleFont(14, width),
                    marginTop: scaleFont(14, width),
                    borderRadius: 4,
                    backgroundColor: accentColor,
                    flexShrink: 0,
                    boxShadow: `0 0 16px ${accentColor}66`,
                    transform: "rotate(45deg)",
                  }}
                />
                <span
                  style={{
                    color: COLORS.item,
                    fontSize: scaleFont(44, width),
                    lineHeight: 1.35,
                    fontWeight: 500,
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
