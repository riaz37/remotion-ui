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

/**
 * 68 + 108 + 88 + 88 + 66 + 62 − 5×12 = 420, and the hook/chart split is
 * 84 + 92 rather than 68 + 108: at 68 the hook's cut landed one seventh into
 * the clip, which is where the docs tile samples its opening frame — the
 * chart's first bar had not sprung yet and the frame was very nearly empty.
 */
const SCENE_DURATIONS = {
  hook: 84,
  chart: 92,
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
          // The hook leaves before the cut instead of during it: exit runs
          // frames 58–70 at 30fps, and the crossfade to the chart only starts
          // at frame 72 (84 − 12). Without this the hook headline and the
          // chart's own title are both legible for the whole 12-frame overlap.
          holdSeconds={58 / 30}
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
          // Three steps walked inside an 88-frame window.
          speed={1.5}
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
          speed={1.4}
          title={ctaTitle}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
