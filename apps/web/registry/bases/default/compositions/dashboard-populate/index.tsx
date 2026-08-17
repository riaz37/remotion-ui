import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionDirectionalWipe } from "@/remotion/primitives/directional-wipe";
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
  {
    label: "Active users",
    value: 12400,
    delta: "+18%",
    trend: [8.2, 9.1, 9.6, 10.4, 11.2, 11.9, 12.4],
  },
  // Counts down from 4.6s, so the "-12%" saving and the moving number agree.
  {
    label: "Render time",
    from: 4.6,
    value: 4,
    suffix: "s",
    delta: "-12%",
    trend: [4.6, 4.52, 4.44, 4.3, 4.2, 4.08, 4],
  },
  {
    label: "Deploys",
    value: 128,
    delta: "+9%",
    trend: [96, 104, 101, 112, 118, 124, 128],
  },
];

/**
 * 100 + 80 − 12 = 168. The metric panel holds settled through the halfway
 * mark, and the cut lands late enough that the chart is nearly counted in by
 * the end of the clip.
 */
const SCENE_DURATIONS = {
  metrics: 100,
  chart: 80,
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
  // A wipe rather than a crossfade: both scenes head their own frame, and a
  // dissolve between them prints one heading over the other for the whole
  // overlap. The wipe keeps exactly one heading legible at any frame.
  const wipe = transitionDirectionalWipe({
    durationInFrames: DURATION.fast,
    direction: "from-right",
    edgeSoftness: 0.08,
  });

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.metrics}>
          <MetricTicker metrics={metrics} title={metricsTitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...wipe} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.chart}>
          <AnimatedBarChart data={barData} title={chartTitle} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
