import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { DURATION } from "@/remotion/lib/motion-tokens";

const SAMPLE = `export const Clip = () => (
  <TitleCard title="Live preview" />
);`;

const SCENE_DURATIONS = {
  code: 90,
  device: 90,
} as const;

export type LiveCodeSplitProps = {
  code?: string;
};

export const LiveCodeSplit: React.FC<LiveCodeSplitProps> = ({
  code = SAMPLE,
}) => {
  const fade = transitionFade({ durationInFrames: DURATION.fast });

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.code}>
          <CodeReveal code={code} title="Composition.tsx" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fade} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceMockupZoom device="laptop" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
