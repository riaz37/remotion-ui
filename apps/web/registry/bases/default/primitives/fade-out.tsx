import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
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

  return <MotionWrapper style={{ opacity }}>{children}</MotionWrapper>;
};
