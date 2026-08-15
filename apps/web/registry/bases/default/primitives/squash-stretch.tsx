import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type SquashStretchMode = "bounce" | "pulse" | "impact";

export type SquashStretchProps = {
  children: ReactNode;
  /**
   * `bounce` travels and deforms on landing, `pulse` breathes in place,
   * `impact` deforms once at `startAtInFrames`.
   */
  mode?: SquashStretchMode;
  /** Length of one cycle, in frames. */
  periodInFrames?: number;
  /** How far it travels in `bounce`, in px. 0 deforms in place. */
  travel?: number;
  /** How hard it flattens on contact, 0–1. Above 0.4 reads as cartoon. */
  squash?: number;
  /** How far it elongates at speed, 0–1. */
  stretch?: number;
  /** Frame the cycle starts on. */
  startAtInFrames?: number;
  /** How much of the cycle the contact lasts, 0–1. */
  contact?: number;
  /** Pivot. `bottom` is the floor contact; `center` is a free-floating pulse. */
  origin?: "bottom" | "center" | "top";
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

/**
 * Volume preservation.
 *
 * Squashing on one axis without widening on the other is the single thing that
 * makes a deform read as rubber instead of as a scale bug: the eye tracks area.
 * The reciprocal square root keeps `scaleX * scaleX * scaleY` constant, which is
 * the volume of a body of revolution — the same rule an animator draws by.
 */
function preserveVolume(scaleY: number): number {
  return 1 / Math.sqrt(Math.max(0.05, scaleY));
}

type Deform = { lift: number; scaleY: number };

function bounceAt(t: number, travel: number, squash: number, stretch: number, contact: number): Deform {
  // Height is a half-sine: fastest at the floor, hanging at the apex.
  const lift = Math.abs(Math.sin(Math.PI * t)) ** 0.82 * travel;
  // Distance to the nearest contact, in cycles — contacts sit at t=0 and t=1.
  const toContact = Math.min(t, 1 - t);
  const impact = Math.max(0, 1 - toContact / Math.max(0.01, contact / 2));
  // Vertical speed peaks at the contacts and is zero at the apex.
  const speed = Math.abs(Math.cos(Math.PI * t));
  return {
    lift,
    scaleY: 1 - squash * impact ** 1.4 + stretch * speed * (1 - impact),
  };
}

/**
 * Squash and stretch, the animation principle, as a primitive.
 *
 * Three shapes of the same idea. `bounce` is the textbook ball: it flattens on
 * contact, elongates through the fast part of the travel, and hangs round at
 * the apex where it is slowest. `pulse` is the same deform without the travel,
 * for a logo or an icon that needs weight. `impact` fires once, for something
 * landing into a layout.
 *
 * Every mode preserves volume, and every mode pivots at the bottom by default,
 * because a deform around the centre lifts the element off its own baseline and
 * the floor stops reading as a floor.
 */
export const SquashStretch: React.FC<SquashStretchProps> = ({
  children,
  mode = "bounce",
  periodInFrames = 36,
  travel = 90,
  squash = 0.28,
  stretch = 0.16,
  startAtInFrames = 0,
  contact = 0.22,
  origin = "bottom",
  block,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  const period = Math.max(2, Math.round(periodInFrames));
  const since = frame - startAtInFrames;

  let lift = 0;
  let scaleY = 1;

  if (mode === "impact") {
    const t = Math.min(1, Math.max(0, since / period));
    const envelope = since < 0 ? 0 : (1 - t) ** 2.2;
    // One flatten that springs back through a slight overshoot.
    scaleY = 1 - squash * envelope + stretch * Math.sin(Math.PI * t) * (1 - t);
  } else {
    const t = ((since % period) + period) % period / period;
    if (mode === "pulse") {
      scaleY = 1 + (stretch + squash) * 0.5 * Math.sin(t * Math.PI * 2);
    } else {
      const deform = bounceAt(t, travel, squash, stretch, contact);
      lift = deform.lift;
      scaleY = deform.scaleY;
    }
  }

  const scaleX = preserveVolume(scaleY);

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        transform: `translateY(${(-lift).toFixed(2)}px) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`,
        transformOrigin: origin === "center" ? "center center" : `center ${origin}`,
        willChange: "transform",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
