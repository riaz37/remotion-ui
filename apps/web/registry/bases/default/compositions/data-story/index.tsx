import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CaptionBumper } from "@/remotion/scenes/caption-bumper";
import { EndCard } from "@/remotion/scenes/end-card";
import { MetricTicker, type MetricTickerItem } from "@/remotion/scenes/metric-ticker";
import { TimelineSteps, type TimelineStep } from "@/remotion/scenes/timeline-steps";
import type { ChartDatum } from "@/remotion/lib/chart-utils";

const COLORS = {
  bg: "#080810",
  hookBg: "#0c0c14",
  hookAccent: "#e8b86d",
  chartBg: "#080810",
  chartBar: "#2dd4bf",
  tickerBg: "#0a1014",
  tickerAccent: "#2dd4bf",
  timelineBg: "#0c0c14",
  timelineAccent: "#f59e0b",
  insightBg: "#080810",
  insightAccent: "#2dd4bf",
  endBg: "#080810",
  endAccent: "#e8b86d",
} as const;

const SCENE_DURATIONS = {
  hook: 68,
  chart: 108,
  metrics: 88,
  timeline: 88,
  insight: 66,
  end: 62,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type DataStoryProps = {
  title?: string;
  subtitle?: string;
  barData: ChartDatum[];
  metrics: MetricTickerItem[];
  steps: TimelineStep[];
  chartTitle?: string;
  metricsTitle?: string;
  timelineTitle?: string;
  insight?: string;
  insightEyebrow?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

export const DataStory: React.FC<DataStoryProps> = ({
  title = "Quarterly reach by channel",
  subtitle = "Short-form climbed while long-form held attention",
  barData,
  metrics,
  steps,
  chartTitle = "Views by format",
  metricsTitle = "Signals that mattered",
  timelineTitle = "How we read the quarter",
  insight = "Short-form drove reach; long-form kept attention.",
  insightEyebrow = "Takeaway",
  ctaTitle = "Turn your data into motion",
  ctaLabel,
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
        <AutoFitTitle
          title={title}
          subtitle={subtitle}
          maxFontSize={88}
          accentColor={COLORS.hookAccent}
          backgroundColor={COLORS.hookBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.chart}>
        <AnimatedBarChart
          title={chartTitle}
          data={barData}
          backgroundColor={COLORS.chartBg}
          barColor={COLORS.chartBar}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.metrics}>
        <MetricTicker
          title={metricsTitle}
          metrics={metrics}
          backgroundColor={COLORS.tickerBg}
          accentColor={COLORS.tickerAccent}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.timeline}>
        <TimelineSteps
          title={timelineTitle}
          steps={steps}
          backgroundColor={COLORS.timelineBg}
          accentColor={COLORS.timelineAccent}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.insight}>
        <CaptionBumper
          text={insight}
          eyebrow={insightEyebrow}
          backgroundColor={COLORS.insightBg}
          accentColor={COLORS.insightAccent}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
        <EndCard
          title={ctaTitle}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
