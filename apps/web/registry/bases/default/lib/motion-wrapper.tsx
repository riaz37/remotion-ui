import type { CSSProperties, ReactNode } from "react";

export type MotionWrapperProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
};

/**
 * Inline wrapper for enter/exit animations.
 * Use this instead of AbsoluteFill so siblings stack in flex/grid layout.
 * @see skills/remotion/rules/video-layout.md
 */
export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  style,
  className,
}) => (
  <div
    className={className}
    style={{
      display: "inline-block",
      verticalAlign: "top",
      ...style,
    }}
  >
    {children}
  </div>
);
