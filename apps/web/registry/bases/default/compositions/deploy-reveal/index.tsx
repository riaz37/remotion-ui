import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TerminalSimulator } from "@/remotion/scenes/terminal-simulator";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { DELAY } from "@/remotion/lib/motion-tokens";

export const DeployReveal: React.FC = () => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={90} premountFor={premount}>
        {/* 90 frames — sped up so the prompt returns before the cut. */}
        <TerminalSimulator
          title="Deploy"
          command="vercel deploy --prod"
          steps={[
            { text: "uploading build output", duration: "1.2s" },
            { text: "assigning production domain", duration: "340ms" },
          ]}
          summary="live in 4.2s"
          speed={1.7}
        />
      </Sequence>
      <Sequence from={90} durationInFrames={90} premountFor={premount}>
        <DeviceMockupZoom device="laptop" />
      </Sequence>
    </AbsoluteFill>
  );
};
