import { interpolate, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  resolveOrigin,
  useEnterExit,
  type MotionPrimitiveProps,
  type MotionSpring,
  type TransformOrigin,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type SpringInProps = Omit<MotionPrimitiveProps, "spring"> & {
  /** Spring preset name, or an override on the snappy config. */
  config?: MotionSpring;
  /** Scale at the start of the entrance. */
  from?: number;
  /** How far it rises as it springs. Scales with the frame by default. */
  travel?: number;
  origin?: TransformOrigin;
};

/**
 * The physical entrance: scale and a short rise driven by a spring, so the
 * element carries weight into its stop instead of easing to a halt.
 *
 * `config="bouncy"` overshoots — both the scale and the rise pass their
 * resting value and settle back, which is the point of using a spring at all.
 */
export const SpringIn: React.FC<SpringInProps> = ({
  children,
  config = "snappy",
  from = 0.88,
  travel: travelProp,
  origin = "center",
  block,
  style,
  className,
  ...motionProps
}) => {
  const { width } = useVideoConfig();
  const travel = travelProp ?? scaleFont(14, width);
  const { motion, displace, opacity, sign } = useEnterExit({
    ...motionProps,
    spring: config,
  });

  const scale = interpolate(motion, [0, 1], [from, 1]);

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        scale,
        translate: `0px ${displace * travel * sign}px`,
        transformOrigin: resolveOrigin(origin),
      }}
    >
      {children}
    </MotionWrapper>
  );
};
