import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { EndCard } from "@/remotion/scenes/end-card";
import { FeatureList } from "@/remotion/scenes/feature-list";
import { StatCard } from "@/remotion/scenes/stat-card";
import { TitleCard } from "@/remotion/scenes/title-card";

const SCENE_DURATIONS = {
  title: 60,
  features: 90,
  stat: 75,
  end: 60,
} as const;

const FADE = transitionFade({ durationInFrames: 15 });

export type ShowcaseProps = {
  title?: string;
  subtitle?: string;
};

export const Showcase: React.FC<ShowcaseProps> = ({
  title = "Launch Kit",
  subtitle = "Scenes for product stories",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard title={title} subtitle={subtitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.features}>
          <FeatureList
            title="Built for developers"
            items={[
              "Source you own",
              "Registry-driven CLI",
              "Live docs previews",
            ]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.stat}>
          <StatCard value={100} label="Type-safe motion" suffix="%" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard title={title} cta="Get started" url="remotionui.com" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
