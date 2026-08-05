import { useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  useEnterExit,
  type MotionPrimitiveProps,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type SlideUpProps = MotionPrimitiveProps & {
  /**
   * Vertical offset in pixels at the start. Scales with the frame by default —
   * and under `mask`, defaults to the element's own height instead, which is
   * the only travel that actually clears the mask.
   */
  distance?: number;
  /**
   * Clip the child to its own box so it rises out of a mask rather than
   * fading up. The editorial move for a headline; leaves opacity alone.
   */
  mask?: boolean;
  /** Extra room inside the mask so descenders are not clipped. */
  maskPadding?: number;
};

/**
 * Rises into place. Opacity finishes at 55% of the travel, so the line lands
 * solid instead of still resolving as it stops.
 */
export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  distance: distanceProp,
  mask = false,
  maskPadding = 0,
  block,
  style,
  className,
  ...motionProps
}) => {
  const { width } = useVideoConfig();
  const { displace, opacity, sign } = useEnterExit(motionProps);

  if (mask) {
    /* Percentages are of the element's own height, so any box clears its mask
     * without the caller having to know how tall the content came out. */
    const travel =
      distanceProp === undefined
        ? `${displace * 100 * sign}%`
        : `${displace * distanceProp * sign}px`;

    return (
      <MotionWrapper
        block={block}
        className={className}
        style={{
          overflow: "hidden",
          paddingBottom: maskPadding,
          marginBottom: -maskPadding,
          ...style,
        }}
      >
        <div style={{ translate: `0px ${travel}` }}>{children}</div>
      </MotionWrapper>
    );
  }

  const offset = displace * (distanceProp ?? scaleFont(40, width)) * sign;

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        translate: `0px ${offset}px`,
        transformOrigin: "center bottom",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
