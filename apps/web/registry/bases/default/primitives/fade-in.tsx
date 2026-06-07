import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export type FadeInProps = {
  children: ReactNode;
  /** Duration of the fade-in animation in frames */
  durationInFrames?: number;
  /** Delay before the fade-in starts, in frames */
  delayInFrames?: number;
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [delayInFrames, delayInFrames + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
