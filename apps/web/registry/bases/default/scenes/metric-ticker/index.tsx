import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { formatCompactNumber } from "@/remotion/lib/chart-utils";
import { getSafePadding } from "@/remotion/lib/layout";

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

export const MetricTicker: React.FC<MetricTickerProps> = ({
  metrics,
  title = "Metrics that matter",
  backgroundColor = "#020617",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.08 });

  return (
    <div style={{ width, height, background: backgroundColor, color: "white", padding, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", gap: 42, justifyContent: "center" }}>
      <h2 style={{ margin: 0, fontSize: Math.round(width * 0.052), lineHeight: 1 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`, gap: 24 }}>
        {metrics.slice(0, 3).map((metric, index) => {
          const progress = interpolate(frame, [index * 8, index * 8 + 36], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={metric.label} style={{ border: "1px solid rgba(148,163,184,0.22)", borderRadius: 24, padding: 28, background: "rgba(15,23,42,0.78)", opacity: progress, transform: `translateY(${(1 - progress) * 22}px)` }}>
              <div style={{ color: "#94a3b8", fontSize: 24, fontWeight: 700 }}>{metric.label}</div>
              <div style={{ color: accentColor, fontSize: Math.round(width * 0.05), fontWeight: 900, marginTop: 14 }}>
                {formatCompactNumber(Math.round(metric.value * progress))}{metric.suffix ?? ""}
              </div>
              {metric.delta ? <div style={{ color: "#a7f3d0", fontSize: 22, marginTop: 10 }}>{metric.delta}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
