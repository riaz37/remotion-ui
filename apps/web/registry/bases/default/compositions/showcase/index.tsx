import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { EndCard } from "@/remotion/scenes/end-card";
import { FeatureList } from "@/remotion/scenes/feature-list";
import { StatCard } from "@/remotion/scenes/stat-card";
import { TitleCard } from "@/remotion/scenes/title-card";

const COLORS = {
  bg: "#080810",
  accent: "#e8b86d",
  featureBg: "#0c0c14",
  statBg: "#0a1014",
  statAccent: "#2dd4bf",
  endBg: "#080810",
  endAccent: "#f59e0b",
} as const;

const SCENE_DURATIONS = {
  title: 60,
  features: 90,
  stat: 75,
  end: 60,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type ShowcaseProps = {
  title?: string;
  subtitle?: string;
  featureTitle?: string;
  featureItems?: string[];
  statValue?: number;
  statLabel?: string;
  statSuffix?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export const Showcase: React.FC<ShowcaseProps> = ({
  title = "Product story",
  subtitle = "Install source, compose scenes, render on your timeline",
  featureTitle = "Three layers you own",
  featureItems = [
    "Motion primitives you can edit",
    "Scenes for hooks, charts, and captions",
    "Compositions that wire the full story",
  ],
  statValue = 3,
  statLabel = "Runtime dependencies",
  statSuffix = "",
  ctaLabel,
  ctaUrl,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard
            title={title}
            subtitle={subtitle}
            backgroundColor={COLORS.bg}
            accentColor={COLORS.accent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.features}>
          <FeatureList
            title={featureTitle}
            items={featureItems}
            backgroundColor={COLORS.featureBg}
            accentColor={COLORS.accent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.stat}>
          <StatCard
            value={statValue}
            label={statLabel}
            suffix={statSuffix}
            backgroundColor={COLORS.statBg}
            accentColor={COLORS.statAccent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard
            title={title}
            cta={ctaLabel}
            url={ctaUrl}
            backgroundColor={COLORS.endBg}
            accentColor={COLORS.endAccent}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
