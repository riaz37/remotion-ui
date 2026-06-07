import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { enterProgress } from "@/remotion/lib/timing";

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
  const opacity = enterProgress(frame, delayInFrames, durationInFrames);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
