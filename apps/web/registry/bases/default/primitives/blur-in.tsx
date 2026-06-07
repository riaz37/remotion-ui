import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
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
    <AbsoluteFill
      style={{
        opacity: progress,
        filter: `blur(${(1 - progress) * maxBlur}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
