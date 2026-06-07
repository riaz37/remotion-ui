import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
import { enterProgress } from "@/remotion/lib/timing";

export type BlurInProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
  maxBlur?: number;
};

export const BlurIn: React.FC<BlurInProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
  maxBlur = 10,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);

  return (
    <MotionWrapper
      style={{
        opacity: progress,
        filter: `blur(${(1 - progress) * maxBlur}px)`,
      }}
    >
      {children}
    </MotionWrapper>
  );
};
