import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
import { enterProgress } from "@/remotion/lib/timing";

export type RotateInProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
  degrees?: number;
};

export const RotateIn: React.FC<RotateInProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
  degrees = -12,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);
  const rotation = interpolate(progress, [0, 1], [degrees, 0]);

  return (
    <MotionWrapper
      style={{
        opacity: progress,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
