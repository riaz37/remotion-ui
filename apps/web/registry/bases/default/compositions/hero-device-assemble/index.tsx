import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";
import { TitleCard } from "@/remotion/scenes/title-card";
import { DELAY } from "@/remotion/lib/motion-tokens";

export type HeroDeviceAssembleProps = {
  title?: string;
  subtitle?: string;
};

export const HeroDeviceAssemble: React.FC<HeroDeviceAssembleProps> = ({
  title = "Ship on every screen",
  subtitle = "Device layers spring into frame",
}) => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={75} premountFor={premount}>
        <TitleCard title={title} subtitle={subtitle} />
      </Sequence>
      <Sequence from={75} durationInFrames={105} premountFor={premount}>
        <DeviceMockupZoom device="laptop" />
      </Sequence>
    </AbsoluteFill>
  );
};
