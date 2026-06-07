import { Children, isValidElement, type ReactNode } from "react";
import { Sequence, useVideoConfig } from "remotion";
import { staggerDelay } from "@/remotion/lib/timing";

export type StaggerChildrenProps = {
  children: ReactNode;
  staggerInFrames?: number;
  baseDelayInFrames?: number;
};

/**
 * Staggers children using Remotion Sequence with layout="none".
 * Each child animates from local frame 0 when its slot begins.
 * @see skills/remotion/rules/sequencing.md
 */
export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  staggerInFrames = 8,
  baseDelayInFrames = 0,
}) => {
  const { fps } = useVideoConfig();
  const premountFor = Math.max(staggerInFrames, Math.round(fps * 0.5));

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return child;
        }

        const from = staggerDelay(index, staggerInFrames, baseDelayInFrames);

        return (
          <Sequence
            key={child.key ?? `stagger-${index}`}
            from={from}
            layout="none"
            premountFor={premountFor}
          >
            {child}
          </Sequence>
        );
      })}
    </>
  );
};
