import { LightLeak } from "@remotion/light-leaks";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

export type TransitionLightLeakProps = {
  durationInFrames?: number;
  seed?: number;
  /** Hue rotation in degrees — warm amber by default */
  hueShift?: number;
};

/** Light leak overlay for TransitionSeries.Overlay */
export const TransitionLightLeak: React.FC<TransitionLightLeakProps> = ({
  durationInFrames = DURATION.fast,
  seed = 0,
  hueShift = 28,
}) => {
  const frame = useCurrentFrame();
  const envelope = interpolate(
    frame,
    [0, durationInFrames * 0.22, durationInFrames * 0.55, durationInFrames],
    [0, 1, 0.85, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );
  const scale = interpolate(envelope, [0, 1], [1.08, 1]);

  return (
    <AbsoluteFill style={{ opacity: envelope, scale }}>
      <LightLeak
        durationInFrames={durationInFrames}
        seed={seed}
        hueShift={hueShift}
      />
    </AbsoluteFill>
  );
};
