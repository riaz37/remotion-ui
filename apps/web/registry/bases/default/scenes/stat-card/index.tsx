import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Counter } from "@/remotion/primitives/counter";
import { SpringIn } from "@/remotion/primitives/spring-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type StatCardProps = {
  value: number;
  label: string;
  suffix?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#0a0e1a",
  label: "#94a3b8",
  accent: "#38bdf8",
} as const;

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  suffix = "",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const ringSize = scaleFont(280, width);

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
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `${scaleFont(2, width)}px solid ${accentColor}44`,
          boxShadow: `0 0 ${scaleFont(48, width)}px ${accentColor}22`,
          opacity: 0.65,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: ringSize * 0.72,
          height: ringSize * 0.72,
          borderRadius: "50%",
          border: `${scaleFont(1, width)}px solid ${accentColor}22`,
          opacity: 0.4,
        }}
      />
      <SpringIn durationInFrames={DURATION.normal}>
        <div style={{ textAlign: "center", position: "relative" }}>
          <Counter
            from={0}
            to={value}
            suffix={suffix}
            durationInFrames={DURATION.slow * 2}
            style={{
              fontSize: scaleFont(96, width),
              color: accentColor,
              fontFamily,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          />
          <p
            style={{
              color: COLORS.label,
              fontSize: scaleFont(32, width),
              marginTop: scaleFont(16, width),
              marginBottom: 0,
              fontWeight: 500,
            }}
          >
            {label}
          </p>
        </div>
      </SpringIn>
    </AbsoluteFill>
  );
};
