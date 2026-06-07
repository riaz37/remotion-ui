import { AbsoluteFill, Sequence } from "remotion";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { TitleCard } from "@/remotion/scenes/title-card";

export type IntroProps = {
  title?: string;
  subtitle?: string;
};

export const Intro: React.FC<IntroProps> = ({
  title = "RemotionUI",
  subtitle = "Copy-paste video components",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={120}>
        <TitleCard title={title} subtitle={subtitle} />
      </Sequence>
      <Sequence from={120} durationInFrames={30}>
        <FadeOut durationInFrames={30}>
          <TitleCard title={title} subtitle={subtitle} />
        </FadeOut>
      </Sequence>
    </AbsoluteFill>
  );
};
