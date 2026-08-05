import { interpolate } from "remotion";
import {
  useEnterExit,
  type MotionPrimitiveProps,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type FadeInProps = MotionPrimitiveProps & {
  /** Opacity the fade starts from. */
  from?: number;
  /** Opacity the fade settles on. */
  to?: number;
};

/**
 * Opacity alone — no transform, so it composes with anything already moving.
 *
 * The curve spends the whole duration here instead of leading it the way the
 * transform primitives do: with nothing travelling underneath, a fade that
 * finishes early just reads as a short fade.
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  from = 0,
  to = 1,
  block,
  style,
  className,
  ...motionProps
}) => {
  const { motion } = useEnterExit(motionProps);
  const opacity = interpolate(motion, [0, 1], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <MotionWrapper block={block} className={className} style={{ ...style, opacity }}>
      {children}
    </MotionWrapper>
  );
};
