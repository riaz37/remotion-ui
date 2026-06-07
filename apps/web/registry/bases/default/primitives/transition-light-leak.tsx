import { LightLeak } from "@remotion/light-leaks";

export type TransitionLightLeakProps = {
  durationInFrames?: number;
  seed?: number;
  hueShift?: number;
};

/** Light leak overlay for TransitionSeries.Overlay */
export const TransitionLightLeak: React.FC<TransitionLightLeakProps> = ({
  durationInFrames,
  seed = 0,
  hueShift = 0,
}) => {
  return (
    <LightLeak
      durationInFrames={durationInFrames}
      seed={seed}
      hueShift={hueShift}
    />
  );
};
