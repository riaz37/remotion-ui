import type { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";
import { EASING_EXIT } from "@/remotion/lib/timing";

export type FadeOutProps = {
  children: ReactNode;
  /** Length of the fade in frames. */
  durationInFrames?: number;
  /**
   * Frame the fade starts on. Left out, it lands on the last frame of the
   * surrounding `<Sequence>` — the usual intent, and one less number to keep
   * in sync when the window changes.
   */
  delayInFrames?: number;
  /** Opacity it holds before the fade. */
  from?: number;
  /** Opacity it ends on. */
  to?: number;
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

/**
 * Holds, then leaves on an ease-in curve — an exit accelerates away, it never
 * decelerates into nothing.
 */
export const FadeOut: React.FC<FadeOutProps> = ({
  children,
  durationInFrames = 30,
  delayInFrames,
  from = 1,
  to = 0,
  block,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: windowFrames } = useVideoConfig();

  const duration = Math.max(1, Math.round(durationInFrames));
  const start =
    delayInFrames ??
    (Number.isFinite(windowFrames) ? Math.max(0, windowFrames - duration) : 0);

  const opacity = interpolate(frame, [start, start + duration], [from, to], {
    easing: EASING_EXIT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <MotionWrapper block={block} className={className} style={{ ...style, opacity }}>
      {children}
    </MotionWrapper>
  );
};
