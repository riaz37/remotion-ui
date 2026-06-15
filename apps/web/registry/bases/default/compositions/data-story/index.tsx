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
  bg: "#050810",
  hookBg: "#050810",
  hookAccent: "#38bdf8",
  chartBg: "#071018",
  tickerBg: "#0a1220",
  timelineBg: "#0c1424",
  insightBg: "#081018",
  endBg: "#050810",
  endAccent: "#38bdf8",
} as const;

export type DataStoryProps = {
  title?: string;
  subtitle?: string;
  barData: ChartDatum[];
  metrics: MetricTickerItem[];
  steps: TimelineStep[];
  insight?: string;
  insightEyebrow?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const fade = transitionFade({ durationInFrames: DURATION.fast });

export const DataStory: React.FC<DataStoryProps> = ({
  title = "Quarter in review",
  subtitle = "Volume climbed while watch time held steady",
  barData,
  metrics,
  steps,
  insight = "Short-form drove reach; long-form kept attention.",
  insightEyebrow = "Takeaway",
  ctaTitle,
  ctaLabel,
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <AutoFitTitle
          title={title}
          subtitle={subtitle}
          accentColor={COLORS.hookAccent}
          backgroundColor={COLORS.hookBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={100}>
        <AnimatedBarChart data={barData} backgroundColor={COLORS.chartBg} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <MetricTicker metrics={metrics} backgroundColor={COLORS.tickerBg} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={80}>
        <TimelineSteps steps={steps} backgroundColor={COLORS.timelineBg} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <CaptionBumper
          text={insight}
          eyebrow={insightEyebrow}
          backgroundColor={COLORS.insightBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <EndCard
          title={ctaTitle ?? title}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
