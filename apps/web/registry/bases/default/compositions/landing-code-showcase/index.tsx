import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { TitleCard } from "@/remotion/scenes/title-card";
import { DELAY } from "@/remotion/lib/motion-tokens";

const CODE = `npx remotion-ui@latest add hero-loop
pnpm remotion render src/index.ts HeroLoop out/hero.mp4`;

export const LandingCodeShowcase: React.FC = () => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={75} premountFor={premount}>
        <TitleCard title="Install. Edit. Render." subtitle="Source you own" />
      </Sequence>
      <Sequence from={75} durationInFrames={105} premountFor={premount}>
        <CodeReveal code={CODE} title="Terminal" />
      </Sequence>
    </AbsoluteFill>
  );
};
