import type { CSSProperties, ReactNode } from "react";
import { Sequence } from "remotion";

export type MotionTrailProps = {
  /**
   * The moving element. It must animate from `useCurrentFrame()` — the trail is
   * literally this subtree re-rendered at earlier frames.
   */
  children: ReactNode;
  /** How many echoes trail behind. */
  count?: number;
  /** Frames between echoes. Wider gaps stretch the trail without adding cost. */
  gapInFrames?: number;
  /** Opacity of the first echo. Every later one fades further. */
  opacity?: number;
  /** How fast the echoes fade. 1 is linear, 2 keeps the tail short. */
  falloff?: number;
  /** Scale of the last echo. 1 keeps them all the same size. */
  scale?: number;
  /** Blur on the last echo, in px. Echoes closer to the subject blur less. */
  blur?: number;
  /** Tint the echoes. Omit to echo the element's own colours. */
  color?: string;
  /** How the echoes composite. `screen` is right on a dark stage. */
  blendMode?: CSSProperties["mixBlendMode"];
  /** Fill the parent instead of shrink-wrapping the subject. */
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

/**
 * Echo trails behind a moving element.
 *
 * The trick is that an echo is not a copy of the element's *position* — it is
 * the element itself, rendered at an earlier frame. `<Sequence from={n}>` shifts
 * the frame its children see by `-n`, so an echo at `from={gap * i}` renders
 * exactly what the subject looked like `gap * i` frames ago, whatever it was
 * doing. That means the trail is correct for any motion, including rotation,
 * colour changes and shape changes, with no path to describe and no state to
 * carry between frames.
 *
 * The cost is real: `count` echoes render the subtree `count + 1` times per
 * frame. Keep the subject small, and prefer a wider `gapInFrames` over a higher
 * `count` when the trail needs length.
 *
 * Echoes before frame `gap * i` do not exist yet, so a trail grows in naturally
 * at the start of a composition rather than appearing fully formed.
 */
export const MotionTrail: React.FC<MotionTrailProps> = ({
  children,
  count = 6,
  gapInFrames = 3,
  opacity = 0.45,
  falloff = 1.6,
  scale = 0.82,
  blur = 4,
  color,
  blendMode = "screen",
  block,
  style,
  className,
}) => {
  const echoes = Math.max(0, Math.round(count));
  const gap = Math.max(1, Math.round(gapInFrames));

  const stack: CSSProperties = { gridArea: "1 / 1", placeSelf: "center" };

  return (
    <div
      className={className}
      style={{
        display: block ? "grid" : "inline-grid",
        ...(block ? { width: "100%" } : {}),
        verticalAlign: "top",
        ...style,
      }}
    >
      {Array.from({ length: echoes }, (_, index) => {
        // Oldest first, so the freshest echo is painted nearest the subject.
        // The divisor is `echoes + 1`: dividing by `echoes` puts the oldest
        // echo at age 1, which fades it to nothing and wastes a whole render.
        const age = (echoes - index) / (echoes + 1);
        const fade = opacity * (1 - age) ** falloff;

        return (
          <Sequence key={index} from={gap * (echoes - index)} layout="none">
            <div
              style={{
                ...stack,
                opacity: fade,
                scale: `${(1 - (1 - scale) * age).toFixed(4)}`,
                filter: `blur(${(blur * age).toFixed(2)}px)`,
                mixBlendMode: blendMode,
                pointerEvents: "none",
                ...(color ? { color } : {}),
              }}
            >
              {children}
            </div>
          </Sequence>
        );
      })}
      <div style={stack}>{children}</div>
    </div>
  );
};
