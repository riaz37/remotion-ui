import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { enterProgress } from "@/remotion/lib/timing";

export type SlideLeftProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
  distance?: number;
};

export const SlideLeft: React.FC<SlideLeftProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
  distance = 60,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        opacity: progress,
        transform: `translateX(${(1 - progress) * distance}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
