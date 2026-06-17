import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
import { enterProgress } from "@/remotion/lib/timing";

export type BlurInProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
  maxBlur?: number;
  scaleFrom?: number;
};

export const BlurIn: React.FC<BlurInProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
  maxBlur = 10,
  scaleFrom = 0.98,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);
  const scale = interpolate(progress, [0, 1], [scaleFrom, 1]);

  return (
    <MotionWrapper
      style={{
        opacity: progress,
        filter: `blur(${(1 - progress) * maxBlur}px)`,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </MotionWrapper>
  );
};
