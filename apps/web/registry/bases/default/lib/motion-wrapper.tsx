import type { CSSProperties, ReactNode } from "react";

export type MotionWrapperProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /**
   * Fill the parent's width instead of shrink-wrapping the child. Needed when
   * the child sizes itself from its container — a bar, a justified headline —
   * because an inline-block parent collapses to the content width.
   */
  block?: boolean;
};

/**
 * Inline wrapper for enter/exit animations.
 * Use this instead of AbsoluteFill so siblings stack in flex/grid layout.
 * @see skills/remotion/remotion-create/video-layout.md
 */
export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  style,
  className,
  block = false,
}) => (
  <div
    className={className}
    style={{
      display: block ? "block" : "inline-block",
      ...(block ? { width: "100%" } : {}),
      verticalAlign: "top",
      ...style,
    }}
  >
    {children}
  </div>
);
