import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { formatCompactNumber, getChartDomain, type ChartDatum } from "@/remotion/lib/chart-utils";
import { getSafePadding } from "@/remotion/lib/layout";

export type AnimatedBarChartProps = {
  title?: string;
  data: ChartDatum[];
  maxValue?: number;
  valueFormatter?: (value: number) => string;
  barColor?: string;
  backgroundColor?: string;
};

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  title = "Growth by channel",
  data,
  maxValue,
  valueFormatter = formatCompactNumber,
  barColor = "#60a5fa",
  backgroundColor = "#0f172a",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.08 });
  const domain = getChartDomain(data.map((item) => item.value));
  const topValue = maxValue ?? domain.max;

  return (
    <div
      style={{
        width,
        height,
        padding,
        background: backgroundColor,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 34,
      }}
    >
      <h2 style={{ margin: 0, fontSize: Math.round(width * 0.05), lineHeight: 1 }}>
        {title}
      </h2>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center" }}>
        {data.map((item, index) => {
          const progress = interpolate(frame, [index * 7, index * 7 + 32], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const widthPercent = Math.max(0.04, item.value / topValue) * progress * 100;
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr 96px", gap: 18, alignItems: "center" }}>
              <div style={{ color: "#cbd5e1", fontSize: 28, fontWeight: 700 }}>{item.label}</div>
              <div style={{ height: 34, borderRadius: 999, background: "rgba(148,163,184,0.16)", overflow: "hidden" }}>
                <div style={{ width: `${widthPercent}%`, height: "100%", borderRadius: 999, background: item.color ?? barColor, boxShadow: `0 0 24px ${item.color ?? barColor}55` }} />
              </div>
              <div style={{ color: "#f8fafc", fontSize: 28, fontWeight: 800, textAlign: "right", opacity: progress }}>
                {valueFormatter(Math.round(item.value * progress))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
