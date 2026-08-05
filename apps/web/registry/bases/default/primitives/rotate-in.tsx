import { interpolate } from "remotion";
import {
  resolveOrigin,
  useEnterExit,
  type MotionPrimitiveProps,
  type TransformOrigin,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type RotateAxis = "z" | "x" | "y";

export type RotateInProps = MotionPrimitiveProps & {
  /** Angle it starts at, in degrees. Negative tilts anticlockwise. */
  degrees?: number;
  /** `z` spins in plane; `x` and `y` hinge in depth. */
  axis?: RotateAxis;
  /** Depth of the 3D projection for the `x` and `y` axes. */
  perspective?: number;
  /** Scale at the start — a rotation that also grows reads as one gesture. */
  scaleFrom?: number;
  /** Point the rotation pivots around. */
  origin?: TransformOrigin;
};

/**
 * Swings into place. On the `x`/`y` axes it hinges in depth, which is how a
 * card or a panel should arrive; `z` is the in-plane spin for badges and marks.
 */
export const RotateIn: React.FC<RotateInProps> = ({
  children,
  degrees = -12,
  axis = "z",
  perspective = 1200,
  scaleFrom = 0.96,
  origin = "center",
  block,
  style,
  className,
  ...motionProps
}) => {
  const { motion, opacity } = useEnterExit(motionProps);
  const rotation = interpolate(motion, [0, 1], [degrees, 0]);
  const scale = interpolate(motion, [0, 1], [scaleFrom, 1]);

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        scale,
        transformOrigin: resolveOrigin(origin),
        ...(axis === "z"
          ? { rotate: `${rotation}deg` }
          : {
              transform: `perspective(${perspective}px) rotate${axis.toUpperCase()}(${rotation}deg)`,
              transformStyle: "preserve-3d",
            }),
      }}
    >
      {children}
    </MotionWrapper>
  );
};
