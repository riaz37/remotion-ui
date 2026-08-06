import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { TitleCard } from "@/remotion/scenes/title-card";

const SCENE_DURATIONS = {
  title: 75,
  device: 105,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type HeroDeviceAssembleProps = {
  title?: string;
  subtitle?: string;
};

export const HeroDeviceAssemble: React.FC<HeroDeviceAssembleProps> = ({
  title = "Ship on every screen",
  subtitle = "Device layers spring into frame",
}) => {
  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleCard title={title} subtitle={subtitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
          <DeviceMockupZoom device="laptop" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
