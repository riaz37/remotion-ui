import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { ChatToPreview } from "@/remotion/scenes/chat-to-preview";
import { TitleCard } from "@/remotion/scenes/title-card";

/** 48 + 132 − 12 = 168. The browse itself gets the frames; the card is a bumper. */
const SCENE_DURATIONS = {
  title: 48,
  preview: 132,
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
          {/* Every beat, including the headline sweep, inside 48 frames. */}
          <TitleCard title={title} subtitle={url} speed={1.4} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.preview}>
          {/* The address is typed, the browser navigates to it, and the page
              paints in the tab beside the thread. `speed` fits the three-turn
              exchange plus the page load inside the 120-frame scene. */}
          <ChatToPreview
            speed={1.4}
            messages={[
              { role: "user", text: `Open ${url}` },
              {
                role: "assistant",
                text: "Docs are live. The scenes reference lists every installable scene with its props.",
              },
              { role: "user", text: "Show the scenes reference" },
            ]}
            previewUrl={url}
            previewLabel="Remotion UI · Docs"
            previewTitle="Scenes reference"
            previewCaption="Every scene, installed with one command"
            placeholder="Ask for a page…"
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
