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
        <TerminalSimulator title="Deploy" />
      </Sequence>
      <Sequence from={90} durationInFrames={90} premountFor={premount}>
        <DeviceMockupZoom device="laptop" />
      </Sequence>
    </AbsoluteFill>
  );
};
