import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { formatCompactNumber } from "@/remotion/lib/chart-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800", "900"],
  subsets: ["latin"],
});

export type MetricTickerItem = {
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
};

export type MetricTickerProps = {
  metrics: MetricTickerItem[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#06080f",
  title: "#e4e4e7",
  label: "#a1a1aa",
  card: "rgba(12,16,28,0.82)",
  border: "rgba(161,161,170,0.18)",
  delta: "#6ee7b7",
  accent: "#a78bfa",
} as const;

export const MetricTicker: React.FC<MetricTickerProps> = ({
  metrics,
  title,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const columns = Math.min(metrics.length, 3);

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        backgroundImage: `radial-gradient(circle at 80% 20%, ${accentColor}14, transparent 42%)`,
        color: COLORS.title,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(36, width),
        justifyContent: "center",
      }}
    >
      {title ? (
        <h2
          style={{
            margin: 0,
            fontSize: scaleFont(52, width),
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: scaleFont(20, width),
        }}
      >
        {metrics.slice(0, 3).map((metric, index) => {
          const delay = index * STAGGER.normal;
          const progress = interpolate(
            frame,
            [delay, delay + DURATION.normal],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <div
              key={metric.label}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: scaleFont(20, width),
                padding: scaleFont(24, width),
                background: COLORS.card,
                opacity: progress,
                transform: `translateY(${(1 - progress) * 20}px)`,
              }}
            >
              <div
                style={{
                  color: COLORS.label,
                  fontSize: scaleFont(24, width),
                  fontWeight: 700,
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  color: accentColor,
                  fontSize: scaleFont(48, width),
                  fontWeight: 900,
                  marginTop: scaleFont(12, width),
                  letterSpacing: "-0.02em",
                }}
              >
                {formatCompactNumber(Math.round(metric.value * progress))}
                {metric.suffix ?? ""}
              </div>
              {metric.delta ? (
                <div
                  style={{
                    color: COLORS.delta,
                    fontSize: scaleFont(22, width),
                    marginTop: scaleFont(8, width),
                    fontWeight: 600,
                  }}
                >
                  {metric.delta}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
