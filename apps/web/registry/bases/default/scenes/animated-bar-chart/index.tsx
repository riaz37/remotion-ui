import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  formatCompactNumber,
  getChartDomain,
  type ChartDatum,
} from "@/remotion/lib/chart-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export type AnimatedBarChartProps = {
  title?: string;
  data: ChartDatum[];
  maxValue?: number;
  valueFormatter?: (value: number) => string;
  barColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  label: "#a1a1aa",
  track: "rgba(161,161,170,0.14)",
  value: "#f8fafc",
  bar: "#2dd4bf",
} as const;

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  title,
  data,
  maxValue,
  valueFormatter = formatCompactNumber,
  barColor = COLORS.bar,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const domain = getChartDomain(data.map((item) => item.value));
  const topValue = maxValue ?? domain.max;
  const isPortrait = height > width;
  const labelWidth = scaleFont(isPortrait ? 120 : 160, width);
  const valueWidth = scaleFont(isPortrait ? 72 : 96, width);
  const barHeight = scaleFont(34, width);
  const titleProgress = title
    ? interpolate(frame, [0, DURATION.fast], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      })
    : 0;

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        background: backgroundColor,
        color: COLORS.value,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(34, width),
      }}
    >
      {title ? (
        <h2
          style={{
            margin: 0,
            fontSize: scaleFont(84, width),
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 20}px)`,
          }}
        >
          {title}
        </h2>
      ) : null}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(18, width),
          justifyContent: "center",
        }}
      >
        {data.map((item, index) => {
          const delay = STAGGER.normal + index * STAGGER.normal;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 18, stiffness: 120, mass: 0.85 },
            durationInFrames: DURATION.normal,
          });
          const valueProgress = interpolate(progress, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASING.enter,
          });
          const widthPercent =
            Math.max(0.04, item.value / topValue) * valueProgress * 100;
          const fill = item.color ?? barColor;

          return (
            <div
              key={item.label}
              style={{
                display: "grid",
                gridTemplateColumns: `${labelWidth}px 1fr ${valueWidth}px`,
                gap: scaleFont(16, width),
                alignItems: "center",
              }}
            >
              <div
                style={{
                  color: COLORS.label,
                  fontSize: scaleFont(28, width),
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  height: barHeight,
                  borderRadius: 999,
                  background: COLORS.track,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${widthPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: fill,
                    boxShadow: `0 0 24px ${fill}44`,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: scaleFont(28, width),
                  fontWeight: 700,
                  textAlign: "right",
                  opacity: progress,
                  transform: `translateY(${(1 - progress) * 8}px)`,
                }}
              >
                {valueFormatter(Math.round(item.value * valueProgress))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
