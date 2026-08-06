import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";
import { MetricTicker, type MetricTickerItem } from "@/remotion/scenes/metric-ticker";
import { DURATION } from "@/remotion/lib/motion-tokens";
import type { ChartDatum } from "@/remotion/lib/chart-utils";

const BAR_DATA: ChartDatum[] = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 71 },
  { label: "Thu", value: 64 },
];

const METRICS: MetricTickerItem[] = [
  { label: "Active users", value: 12400, suffix: "", delta: "+18%" },
  { label: "Render time", value: 4, suffix: "s", delta: "-12%" },
];

const SCENE_DURATIONS = {
  metrics: 90,
  chart: 90,
} as const;

export type DashboardPopulateProps = {
  metrics?: MetricTickerItem[];
  barData?: ChartDatum[];
  metricsTitle?: string;
  chartTitle?: string;
  backgroundColor?: string;
};

export const DashboardPopulate: React.FC<DashboardPopulateProps> = ({
  metrics = METRICS,
  barData = BAR_DATA,
  metricsTitle = "Dashboard waking up",
  chartTitle = "Weekly throughput",
  backgroundColor = "#080810",
}) => {
  const fade = transitionFade({ durationInFrames: DURATION.fast });

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.metrics}>
          <MetricTicker metrics={metrics} title={metricsTitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fade} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.chart}>
          <AnimatedBarChart data={barData} title={chartTitle} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
