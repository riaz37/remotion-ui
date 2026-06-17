import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { ChatToPreview } from "@/remotion/scenes/chat-to-preview";
import { StatCard } from "@/remotion/scenes/stat-card";
import { DELAY } from "@/remotion/lib/motion-tokens";

export type AiGenerationCanvasProps = {
  prompt?: string;
};

export const AiGenerationCanvas: React.FC<AiGenerationCanvasProps> = ({
  prompt = "Build a launch dashboard",
}) => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={90} premountFor={premount}>
        <ChatToPreview
          messages={[{ role: "user", text: prompt }]}
          previewTitle="Generating layout…"
        />
      </Sequence>
      <Sequence from={90} durationInFrames={90} premountFor={premount}>
        <StatCard value={12} label="Cards rendered" suffix=" live" />
      </Sequence>
    </AbsoluteFill>
  );
};
