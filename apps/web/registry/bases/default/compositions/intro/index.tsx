import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { TitleCard } from "@/remotion/scenes/title-card";

export type IntroProps = {
  title?: string;
  subtitle?: string;
};

export const Intro: React.FC<IntroProps> = ({
  title = "Launch Brief",
  subtitle = "A clean opener for product videos",
}) => {
  const { fps } = useVideoConfig();
  const premountFor = Math.round(fps * 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={120} premountFor={premountFor}>
        <TitleCard title={title} subtitle={subtitle} />
      </Sequence>
      <Sequence from={120} durationInFrames={30} premountFor={premountFor}>
        <FadeOut durationInFrames={30}>
          <TitleCard title={title} subtitle={subtitle} />
        </FadeOut>
      </Sequence>
    </AbsoluteFill>
  );
};
