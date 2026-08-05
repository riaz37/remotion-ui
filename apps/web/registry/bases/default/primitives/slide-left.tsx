import { useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  useEnterExit,
  type MotionPrimitiveProps,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type SlideLeftProps = MotionPrimitiveProps & {
  /**
   * Horizontal offset in pixels at the start. Scales with the frame by default
   * — and under `mask`, defaults to the element's own width.
   */
  distance?: number;
  /** Side the child travels in from. */
  from?: "left" | "right";
  /** Clip the child to its own box so it slides out of a mask. */
  mask?: boolean;
};

/**
 * Slides in on the horizontal — the reading axis, so it suits list rows and
 * lower thirds where a rise would fight the line above it.
 */
export const SlideLeft: React.FC<SlideLeftProps> = ({
  children,
  distance: distanceProp,
  from = "left",
  mask = false,
  block,
  style,
  className,
  ...motionProps
}) => {
  const { width } = useVideoConfig();
  const { displace, opacity, sign } = useEnterExit(motionProps);
  const direction = from === "left" ? -1 : 1;

  if (mask) {
    /* Percentages are of the element's own width, so any box clears its mask. */
    const travel =
      distanceProp === undefined
        ? `${displace * 100 * direction * sign}%`
        : `${displace * distanceProp * direction * sign}px`;

    return (
      <MotionWrapper
        block={block}
        className={className}
        style={{ overflow: "hidden", ...style }}
      >
        <div style={{ translate: `${travel} 0px` }}>{children}</div>
      </MotionWrapper>
    );
  }

  const offset = displace * (distanceProp ?? scaleFont(60, width)) * direction * sign;

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        translate: `${offset}px 0px`,
        transformOrigin: from === "left" ? "left center" : "right center",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
