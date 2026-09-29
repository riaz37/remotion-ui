import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Animatable, Vec2 } from "@/remotion/lib/ae-motion";
import { smoothThrough, toD } from "@/remotion/lib/bezier-path";
import { followChain, type FollowState } from "@/remotion/lib/follow";

export type FollowLink = FollowState & {
  /** 0 = the leader. */
  index: number;
  count: number;
  /** Speed in px per second. */
  speed: number;
};

export type FollowThroughProps = {
  /** The leader's path — a keyframe track, an expression, or a fixed point. */
  leader: Animatable<Vec2>;
  /** Elements after the leader. */
  links?: number;
  /** Spring frequency in Hz; higher is tighter. */
  frequency?: number;
  /** 1 settles without overshoot; lower overshoots and rings. */
  damping?: number;
  /** Frames each link looks back at the one ahead — pure lag. */
  delay?: number;
  /** Per-link frequency multiplier: below 1 the tail gets looser (a whip). */
  falloff?: number;
  /**
   * Start the simulation this many frames early, so a looping leader is
   * already in steady motion on frame 0. Set it to the loop length.
   */
  preroll?: number;
  /** Draws one link. Positioned and (with `orient`) rotated for you. */
  renderLink?: (link: FollowLink) => ReactNode;
  /** Draws the chain's spine — pass `d` to a path for a rope, tail or ribbon. */
  renderSpine?: (spine: { d: string; links: FollowLink[] }) => ReactNode;
  /** Rotate each link to face the one ahead of it. */
  orient?: boolean;
  width?: number;
  height?: number;
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

const DefaultLink: React.FC<{ link: FollowLink }> = ({ link }) => {
  const size = 22 * (1 - (0.6 * link.index) / Math.max(1, link.count - 1));
  return <div style={{ width: size, height: size, borderRadius: "50%", background: "#f4f4f5" }} />;
};

/**
 * Overlapping action: every element follows the one ahead of it on a damped
 * spring, so a single leader track produces drag, lag, overshoot and settle
 * down the whole chain — AE's delay and inertia expressions, but simulated
 * deterministically from frame 0, so any frame renders identically in any
 * order. Draw the links, the spine through them, or both.
 */
export const FollowThrough: React.FC<FollowThroughProps> = ({
  leader,
  links = 8,
  frequency = 2.2,
  damping = 0.45,
  delay = 0,
  falloff = 1,
  preroll = 0,
  renderLink,
  renderSpine,
  orient = true,
  width = 960,
  height = 540,
  frame: frameOverride,
  style,
  className,
}) => {
  const current = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? current;

  const chain = useMemo((): FollowLink[] => {
    const states = followChain(leader, frame + preroll, { links, frequency, damping, delay, falloff }, fps);
    return states.map((state, index) => ({
      ...state,
      index,
      count: states.length,
      speed: Math.hypot(state.velocity[0], state.velocity[1]),
    }));
  }, [leader, frame, preroll, links, frequency, damping, delay, falloff, fps]);

  const spine = useMemo(() => {
    if (!renderSpine || chain.length < 2) return null;
    const path = smoothThrough(
      chain.map((link) => ({ x: link.position[0], y: link.position[1] })),
      false,
    );
    return { d: toD(path), links: chain };
  }, [chain, renderSpine]);

  return (
    <div className={className} style={{ position: "relative", width, height, ...style }}>
      {spine ? (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {renderSpine?.(spine)}
        </svg>
      ) : null}
      {[...chain].reverse().map((link) => (
        <div
          key={link.index}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${link.position[0]}px, ${link.position[1]}px) translate(-50%, -50%)${
              orient ? ` rotate(${link.index === 0 ? link.angle : link.toPrevious}deg)` : ""
            }`,
          }}
        >
          {renderLink ? renderLink(link) : <DefaultLink link={link} />}
        </div>
      ))}
    </div>
  );
};
