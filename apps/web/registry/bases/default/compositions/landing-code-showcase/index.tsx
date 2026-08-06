import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { TitleCard } from "@/remotion/scenes/title-card";
import { DURATION } from "@/remotion/lib/motion-tokens";

const CODE = `npx remotion-ui@latest add hero-loop
pnpm remotion render src/index.ts HeroLoop out/hero.mp4`;

const SCENE_DURATIONS = {
  title: 75,
  code: 105,
} as const;

export const LandingCodeShowcase: React.FC = () => {
  const fade = transitionFade({ durationInFrames: DURATION.fast });

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard title="Install. Edit. Render." subtitle="Source you own" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fade} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.code}>
          <CodeReveal code={CODE} title="install.sh" language="bash" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
