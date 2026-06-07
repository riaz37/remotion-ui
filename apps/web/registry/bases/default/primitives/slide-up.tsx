import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { enterProgress } from "@/remotion/lib/timing";

export type SlideUpProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
  distance?: number;
};

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
  distance = 40,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * distance}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
