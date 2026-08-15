import { interpolate } from "remotion";
import {
  resolveOrigin,
  useEnterExit,
  type MotionPrimitiveProps,
  type TransformOrigin,
} from "@/remotion/lib/motion-primitive";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type SkewDirection = "left" | "right";

export type SkewInProps = MotionPrimitiveProps & {
  /** Horizontal shear it starts at, in degrees. */
  skew?: number;
  /** Vertical shear it starts at. Small values only — this reads as a wobble. */
  skewY?: number;
  /** How far it slides in, in px. Travels against the lean. */
  travel?: number;
  /** Which way the element leans on the way in. */
  direction?: SkewDirection;
  /** Point the shear pivots around. `bottom left` is the editorial default. */
  origin?: TransformOrigin;
};

/**
 * Leans in and straightens up.
 *
 * The shear and the slide are deliberately opposed: the element leans *into*
 * the direction it is travelling from, so the type appears to be dragged
 * upright by its own momentum rather than sliding in pre-formed. That is the
 * difference between this and `slide-left` with a transform on top.
 *
 * The pivot sits on the baseline corner by default (`bottom left`), because a
 * shear around the centre lifts the baseline of a headline and the line below
 * it visibly jumps.
 */
export const SkewIn: React.FC<SkewInProps> = ({
  children,
  skew = 14,
  skewY = 0,
  travel = 56,
  direction = "left",
  origin = "bottom left",
  block,
  style,
  className,
  ...motionProps
}) => {
  const { displace, opacity, sign } = useEnterExit(motionProps);

  // `sign` is -1 only when the caller asked the exit to carry on through, so a
  // continuing exit keeps leaning the same way instead of snapping back.
  const lean = direction === "left" ? 1 : -1;
  const away = displace * sign * lean;

  const skewX = interpolate(away, [0, 1], [0, skew]);
  const shearY = interpolate(away, [0, 1], [0, skewY]);
  const offset = interpolate(away, [0, 1], [0, -travel]);

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        opacity,
        transform: `translateX(${offset.toFixed(3)}px) skew(${skewX.toFixed(3)}deg, ${shearY.toFixed(3)}deg)`,
        transformOrigin: resolveOrigin(origin),
        willChange: "transform, opacity",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
