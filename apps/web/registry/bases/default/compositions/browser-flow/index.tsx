import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { ChatToPreview } from "@/remotion/scenes/chat-to-preview";
import { TitleCard } from "@/remotion/scenes/title-card";
import { DELAY } from "@/remotion/lib/motion-tokens";

export type BrowserFlowProps = {
  url?: string;
  title?: string;
};

export const BrowserFlow: React.FC<BrowserFlowProps> = ({
  url = "remotionui.com/docs",
  title = "Browse the registry",
}) => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={60} premountFor={premount}>
        <TitleCard title={title} subtitle={url} />
      </Sequence>
      <Sequence from={60} durationInFrames={120} premountFor={premount}>
        <ChatToPreview
          messages={[{ role: "user", text: `Open ${url}` }]}
          previewTitle="Docs preview"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
