import { interpolate } from "remotion";
import {
  resolveOrigin,
  useEnterExit,
  type MotionPrimitiveProps,
  type TransformOrigin,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type ScaleInProps = MotionPrimitiveProps & {
  /** Scale at the start of the entrance. */
  from?: number;
  /** Corner or edge the scale grows out of. */
  origin?: TransformOrigin;
};

/**
 * Grows into place from just under full size.
 *
 * `from` stays close to 1 on purpose: a card scaling up from 0.5 reads as a
 * zoom, which is a camera move, not an arrival. Anything below ~0.85 wants a
 * spring behind it — pass `spring` to get one.
 */
export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  from = 0.92,
  origin = "center",
  block,
  style,
  className,
  ...motionProps
}) => {
  const { motion, opacity } = useEnterExit(motionProps);
  const scale = interpolate(motion, [0, 1], [from, 1]);

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        scale,
        transformOrigin: resolveOrigin(origin),
      }}
    >
      {children}
    </MotionWrapper>
  );
};
