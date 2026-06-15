import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { DELAY } from "@/remotion/lib/motion-tokens";
import { TitleCard } from "@/remotion/scenes/title-card";

const COLORS = {
  bg: "#080810",
  accent: "#818cf8",
  subtitle: "#71717a",
} as const;

export type IntroProps = {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const Intro: React.FC<IntroProps> = ({
  title = "Product overview",
  subtitle = "Set context before the walkthrough",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { fps } = useVideoConfig();
  const premountFor = Math.round(fps * 0.5) + DELAY.short;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
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
