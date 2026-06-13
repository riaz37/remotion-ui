import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CaptionBumper } from "@/remotion/scenes/caption-bumper";
import { EndCard } from "@/remotion/scenes/end-card";
import { MetricTicker, type MetricTickerItem } from "@/remotion/scenes/metric-ticker";
import { TimelineSteps, type TimelineStep } from "@/remotion/scenes/timeline-steps";
import type { ChartDatum } from "@/remotion/lib/chart-utils";

export type DataStoryProps = {
  title?: string;
  subtitle?: string;
  barData: ChartDatum[];
  metrics: MetricTickerItem[];
  steps: TimelineStep[];
  insight?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const fade = transitionFade({ durationInFrames: 12 });

export const DataStory: React.FC<DataStoryProps> = ({
  title = "Data story",
  subtitle = "Explain the trend in one minute",
  barData,
  metrics,
  steps,
  insight = "The strongest stories turn numbers into sequence.",
  ctaTitle = "Data Cut",
  ctaLabel = "Build the next story",
}) => (
  <AbsoluteFill style={{ backgroundColor: "#020617" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <AutoFitTitle title={title} subtitle={subtitle} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={100}>
        <AnimatedBarChart data={barData} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <MetricTicker metrics={metrics} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <TimelineSteps steps={steps} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <CaptionBumper text={insight} eyebrow="Insight" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <EndCard title={ctaTitle} cta={ctaLabel} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
