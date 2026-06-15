import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
import { enterProgress } from "@/remotion/lib/timing";

export type ScaleInProps = {
  children: ReactNode;
  durationInFrames?: number;
  delayInFrames?: number;
};

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delayInFrames, durationInFrames);
  const scale = interpolate(progress, [0, 1], [0.92, 1]);

  return (
    <MotionWrapper
      style={{
        opacity: progress,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
