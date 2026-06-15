import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
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
  distance: distanceProp,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const distance = distanceProp ?? scaleFont(40, width);
  const progress = enterProgress(frame, delayInFrames, durationInFrames);

  return (
    <MotionWrapper
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * distance}px)`,
        transformOrigin: "center bottom",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
