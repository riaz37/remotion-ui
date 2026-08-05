import { interpolate } from "remotion";
import {
  useEnterExit,
  type MotionPrimitiveProps,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type BlurInProps = MotionPrimitiveProps & {
  /** Blur radius in pixels at the start. */
  maxBlur?: number;
  /** Scale at the start — the push that sells the pull into focus. */
  scaleFrom?: number;
};

/** Blur is gone by this point of the travel, so the element settles sharp. */
const FOCUS_AT = 0.2;

/**
 * Resolves out of a defocus, like a lens finding its subject.
 *
 * The blur clears before the move does — holding it to the last frame makes
 * the whole entrance feel soft, and the eye reads the sharpening, not the
 * arrival.
 */
export const BlurIn: React.FC<BlurInProps> = ({
  children,
  maxBlur = 10,
  scaleFrom = 0.98,
  block,
  style,
  className,
  ...motionProps
}) => {
  const { motion, displace, opacity, exiting, exitProgress } =
    useEnterExit(motionProps);

  const scale = interpolate(motion, [0, 1], [scaleFrom, 1]);
  const defocus = exiting
    ? exitProgress
    : interpolate(displace, [FOCUS_AT, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        scale,
        filter: `blur(${(defocus * maxBlur).toFixed(2)}px)`,
        willChange: "filter",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
