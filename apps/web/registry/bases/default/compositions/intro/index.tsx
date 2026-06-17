import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { DELAY } from "@/remotion/lib/motion-tokens";
import { TitleCard } from "@/remotion/scenes/title-card";

const COLORS = {
  bg: "#080810",
  accent: "#e8b86d",
  subtitle: "#71717a",
} as const;

export type IntroProps = {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const Intro: React.FC<IntroProps> = ({
  title = "Chapter open",
  subtitle = "Name the topic before the walkthrough begins",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { fps } = useVideoConfig();
  const premountFor = Math.round(fps * 0.5) + DELAY.short;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage:
          "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(232,184,109,0.08), transparent)",
      }}
    >
      <Sequence durationInFrames={120} premountFor={premountFor}>
        <TitleCard
          title={title}
          subtitle={subtitle}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
        />
      </Sequence>
      <Sequence from={120} durationInFrames={30} premountFor={premountFor}>
        <FadeOut durationInFrames={30}>
          <TitleCard
            title={title}
            subtitle={subtitle}
            backgroundColor={backgroundColor}
            accentColor={accentColor}
          />
        </FadeOut>
      </Sequence>
    </AbsoluteFill>
  );
};
