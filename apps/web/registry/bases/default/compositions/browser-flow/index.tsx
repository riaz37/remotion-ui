import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { ChatToPreview } from "@/remotion/scenes/chat-to-preview";
import { TitleCard } from "@/remotion/scenes/title-card";

const SCENE_DURATIONS = {
  title: 60,
  preview: 120,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type BrowserFlowProps = {
  url?: string;
  title?: string;
};

export const BrowserFlow: React.FC<BrowserFlowProps> = ({
  url = "remotionui.com/docs",
  title = "Browse the registry",
}) => {
  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard title={title} subtitle={url} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.preview}>
          <ChatToPreview
            messages={[{ role: "user", text: `Open ${url}` }]}
            previewTitle="Docs preview"
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
