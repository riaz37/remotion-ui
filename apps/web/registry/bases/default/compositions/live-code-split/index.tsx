import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { DELAY } from "@/remotion/lib/motion-tokens";

const SAMPLE = `export const Clip = () => (
  <TitleCard title="Live preview" />
);`;

export type LiveCodeSplitProps = {
  code?: string;
};

export const LiveCodeSplit: React.FC<LiveCodeSplitProps> = ({
  code = SAMPLE,
}) => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={90} premountFor={premount}>
        <CodeReveal code={code} title="Composition.tsx" />
      </Sequence>
      <Sequence from={90} durationInFrames={90} premountFor={premount}>
        <DeviceMockupZoom device="laptop" />
      </Sequence>
    </AbsoluteFill>
  );
};
