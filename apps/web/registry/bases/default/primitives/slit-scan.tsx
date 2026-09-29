import { useMemo, type CSSProperties, type ReactNode } from "react";
import { Freeze, useCurrentFrame } from "remotion";
import { slitGroups, type SlitMode } from "@/remotion/lib/slit-geometry";

export type SlitScanProps = {
  /** Anything time-based: footage, a scene, another motion component. */
  children: ReactNode;
  width?: number;
  height?: number;
  /** `bands` slices straight strips at `angle`; `radial` slices rings around `center`. */
  mode?: SlitMode;
  /** Number of strips. Finer strips cost nothing extra — `levels` sets the cost. */
  strips?: number;
  /** Bands: direction the delay grows along, degrees (0 = left→right, 90 = top→bottom). */
  angle?: number;
  /** Radial: centre as shares of the frame. */
  center?: readonly [number, number];
  /** Delay of the last strip, in frames. */
  maxDelay?: number;
  /**
   * Distinct delays, i.e. how many times the child renders per frame. Strips
   * are grouped onto these levels. 12–24 reads as smooth.
   */
  levels?: number;
  /** Maps strip position 0–1 to delay share 0–1. Default: linear. */
  curve?: (t: number) => number;
  /**
   * Wrap sampled frames into a loop of this length, so strips looking back
   * before frame 0 see the end of the loop instead of holding frame 0. Set it
   * to the child's own loop length for a seamless cycle.
   */
  loopFrames?: number;
  /** Render a specific frame instead of the current one. */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

const CENTER = [0.5, 0.5] as const;

/**
 * Slit-scan time displacement. The frame is cut into strips and each strip
 * shows the child at a different moment — `delay` frames ago — so motion
 * smears, bends and spirals across the frame.
 *
 * Each distinct delay is one `<Freeze>` of the child clipped to its strips,
 * so the render cost is `levels` renders of the child per frame (not
 * `strips`). A light vector child at 16 levels renders at roughly its own
 * speed ×16; heavy footage costs proportionally more — lower `levels` first.
 * Deterministic: every strip is a pure function of the frame.
 */
export const SlitScan: React.FC<SlitScanProps> = ({
  children,
  width = 960,
  height = 540,
  mode = "bands",
  strips = 48,
  angle = 0,
  center = CENTER,
  maxDelay = 20,
  levels = 16,
  curve,
  loopFrames,
  frame: frameOverride,
  style,
  className,
}) => {
  const current = useCurrentFrame();
  const frame = frameOverride ?? current;
  const groups = useMemo(
    () => slitGroups({ width, height, mode, strips, angle, center, maxDelay, levels, curve }),
    [width, height, mode, strips, angle, center, maxDelay, levels, curve],
  );

  const sample = (delay: number) => {
    const f = frame - delay;
    if (loopFrames && loopFrames > 0) return ((f % loopFrames) + loopFrames) % loopFrames;
    return Math.max(0, f);
  };

  return (
    <div
      className={className}
      style={{ position: "relative", width, height, overflow: "hidden", ...style }}
    >
      {groups.map((group) => (
        <div
          key={group.delay}
          style={{
            position: "absolute",
            inset: 0,
            clipPath: group.clipPath,
            WebkitClipPath: group.clipPath,
          }}
        >
          <Freeze frame={sample(group.delay)}>
            <div style={{ width, height }}>{children}</div>
          </Freeze>
        </div>
      ))}
    </div>
  );
};
