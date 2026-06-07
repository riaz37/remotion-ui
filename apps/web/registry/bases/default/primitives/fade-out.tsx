import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { exitProgress } from "@/remotion/lib/timing";

export type FadeOutProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
};

export const FadeOut: React.FC<FadeOutProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const progress = exitProgress(frame, delayInFrames, durationInFrames);
  const opacity = interpolate(progress, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
