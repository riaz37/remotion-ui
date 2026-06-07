import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
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
  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity: progress,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
