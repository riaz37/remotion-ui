import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Counter } from "@/remotion/primitives/counter";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export type StatCardProps = {
  value?: number;
  label?: string;
  suffix?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  label: "#94a3b8",
  accent: "#2dd4bf",
} as const;

export const StatCard: React.FC<StatCardProps> = ({
  value = 98,
  label = "Satisfaction",
  suffix = "%",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const ringSize = scaleFont(280, width);
  const strokeWidth = scaleFont(6, width);
  const radius = ringSize / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const center = ringSize / 2;

  const ringDraw = interpolate(frame, [0, DURATION.slow * 2], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.85 },
    delay: DELAY.short,
  });
  const labelEnter = interpolate(
    frame,
    [DELAY.medium, DELAY.medium + DURATION.fast],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        position: "relative",
      }}
    >
      <svg
        width={ringSize}
        height={ringSize}
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`${accentColor}33`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ringDraw)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            filter: `drop-shadow(0 0 ${scaleFont(12, width)}px ${accentColor}55)`,
          }}
        />
      </svg>
      <div
        style={{
          textAlign: "center",
          position: "relative",
          opacity: Math.min(1, contentEnter),
          transform: `scale(${0.9 + contentEnter * 0.1})`,
        }}
      >
        <Counter
          from={0}
          to={value}
          suffix={suffix}
          durationInFrames={DURATION.slow * 2}
          delayInFrames={DELAY.short}
          style={{
            fontSize: scaleFont(96, width),
            color: accentColor,
            fontFamily,
            fontWeight: 700,
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
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * 10}px)`,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
};
