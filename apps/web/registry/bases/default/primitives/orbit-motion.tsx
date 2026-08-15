import type { CSSProperties, ReactNode } from "react";
import { Children } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type OrbitMotionProps = {
  /** Each child gets its own slot on the orbit, evenly spaced. */
  children: ReactNode;
  /** Horizontal radius, in px. */
  radiusX?: number;
  /** Vertical radius, in px. Smaller than `radiusX` reads as a tilted ring. */
  radiusY?: number;
  /** Frames for one full revolution. */
  periodInFrames?: number;
  /** Where the first child starts, in degrees. 0 is the right of the ring. */
  phase?: number;
  /** Tilt of the whole ring, in degrees. */
  tilt?: number;
  /** Which way it turns. */
  direction?: "cw" | "ccw";
  /** Centre of the orbit, in percent of the frame. */
  centerX?: number;
  centerY?: number;
  /** Scale difference between the near and far side of the ring. 0 is flat. */
  depth?: number;
  /** How much the far side dims, 0–1. */
  depthFade?: number;
  /** Keep children upright instead of letting them ride the ring. */
  upright?: boolean;
  /** Draw the ring itself. */
  showPath?: boolean;
  pathColor?: string;
  /** What sits at the centre — a logo, a label, nothing. */
  center?: ReactNode;
  style?: CSSProperties;
  className?: string;
};

/**
 * An element orbiting a centre point.
 *
 * The ellipse is the easy half. What makes it read as an orbit rather than as
 * a circular slide is depth: a child on the far side of the ring is smaller and
 * dimmer, and — critically — is painted *behind* whatever sits at the centre.
 * `zIndex` is derived from the same sine that drives the scale, so the pass
 * behind the middle happens by itself.
 *
 * Multiple children share one ring, evenly spaced, so a satellite diagram is
 * the default case rather than something the caller assembles by hand.
 */
export const OrbitMotion: React.FC<OrbitMotionProps> = ({
  children,
  radiusX = 210,
  radiusY = 78,
  periodInFrames = 120,
  phase = 0,
  tilt = -12,
  direction = "cw",
  centerX = 50,
  centerY = 50,
  depth = 0.28,
  depthFade = 0.4,
  upright = true,
  showPath = false,
  pathColor = "rgba(255,255,255,0.14)",
  center,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  const items = Children.toArray(children);
  const period = Math.max(2, Math.round(periodInFrames));
  const turn = (frame / period) * (direction === "cw" ? 1 : -1);

  return (
    <AbsoluteFill className={className} style={style}>
      <div
        style={{
          position: "absolute",
          left: `${centerX}%`,
          top: `${centerY}%`,
          width: 0,
          height: 0,
          transform: `rotate(${tilt}deg)`,
        }}
      >
        {showPath ? (
          <div
            style={{
              position: "absolute",
              left: -radiusX,
              top: -radiusY,
              width: radiusX * 2,
              height: radiusY * 2,
              borderRadius: "50%",
              border: `1px solid ${pathColor}`,
            }}
          />
        ) : null}

        {center ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) rotate(${-tilt}deg)`,
              zIndex: 10,
            }}
          >
            {center}
          </div>
        ) : null}

        {items.map((item, index) => {
          const angle = (turn + index / Math.max(1, items.length)) * Math.PI * 2 + (phase * Math.PI) / 180;
          const x = Math.cos(angle) * radiusX;
          const y = Math.sin(angle) * radiusY;
          // sin(angle) is +1 at the near point of the ring and -1 at the far
          // point, which is exactly the depth cue — one number for scale,
          // opacity and paint order.
          const near = Math.sin(angle);
          const scale = 1 + depth * near;
          const fade = 1 - depthFade * (1 - (near + 1) / 2);

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})${upright ? ` rotate(${-tilt}deg)` : ""}`,
                opacity: fade,
                zIndex: near >= 0 ? 20 : 1,
                willChange: "transform",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
