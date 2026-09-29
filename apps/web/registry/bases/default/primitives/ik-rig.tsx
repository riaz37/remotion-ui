import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  applyToPoint,
  resolveAnimatable,
  resolveParenting,
  type Animatable,
  type Vec2,
} from "@/remotion/lib/ae-motion";
import { rubberHose, solveTwoBone, type HoseSolution, type TwoBoneSolution } from "@/remotion/lib/rig";

/** A null object: a point the rig hangs off, optionally parented to another. */
export type IkNull = {
  position: Animatable<Vec2>;
  /** Degrees; rotates any nulls parented to this one. */
  rotation?: Animatable<number>;
  parent?: string;
};

export type IkLimb = {
  /** Null the limb starts at (shoulder, hip, base). */
  from: string;
  /** Null the limb reaches for (hand, foot, head). */
  to: string;
  /** `hose` is one constant-length arc; `bones` is two jointed segments. */
  style?: "hose" | "bones";
  /** Hose: total length. Bones: `[upper, lower]`. */
  length: number | readonly [number, number];
  /** Which side the limb bends to. */
  bend?: 1 | -1;
  /** Let the limb stretch to reach instead of stopping short. */
  stretch?: boolean;
  thickness?: number;
  color?: string;
  /** Bones only: radius of the joint discs. 0 hides them. */
  jointRadius?: number;
};

export type SolvedLimb = IkLimb & {
  root: Vec2;
  target: Vec2;
  /** Where the limb actually ends. */
  end: Vec2;
  /** The elbow/knee for bones; the arc's midpoint for a hose. */
  joint: Vec2;
  d: string;
  bones?: TwoBoneSolution;
  hose?: HoseSolution;
};

export type SolvedRig = {
  /** World position of every null, after parenting. */
  nulls: Record<string, Vec2>;
  limbs: SolvedLimb[];
  frame: number;
};

export type IkRigProps = {
  nulls: Record<string, IkNull>;
  limbs: IkLimb[];
  width?: number;
  height?: number;
  /** Drawn under the limbs — bodies, shadows, floors. */
  renderUnder?: (rig: SolvedRig) => ReactNode;
  /** Drawn over the limbs — heads, hands, lamp shades. */
  renderOver?: (rig: SolvedRig) => ReactNode;
  /** Default limb colour. */
  color?: string;
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

/** Solve every limb for one frame. Pure: exported for rigs drawn elsewhere. */
export function solveRig(
  nulls: Record<string, IkNull>,
  limbs: readonly IkLimb[],
  frame: number,
  fps: number,
): SolvedRig {
  const world = resolveParenting(
    Object.fromEntries(
      Object.entries(nulls).map(([id, n]) => [
        id,
        {
          parent: n.parent,
          transform: {
            position: resolveAnimatable(n.position, frame, { fps }),
            rotation: n.rotation === undefined ? 0 : resolveAnimatable(n.rotation, frame, { fps }),
          },
        },
      ]),
    ),
  );
  const points = Object.fromEntries(Object.entries(world).map(([id, m]) => [id, applyToPoint(m, [0, 0]) as Vec2]));
  const solved = limbs.map((limb): SolvedLimb => {
    const root = points[limb.from];
    const target = points[limb.to];
    if (!root || !target) {
      throw new Error(`IkRig: limb ${limb.from} → ${limb.to} names a null that does not exist.`);
    }
    if ((limb.style ?? "hose") === "bones") {
      const lengths: [number, number] = typeof limb.length === "number" ? [limb.length / 2, limb.length / 2] : [limb.length[0], limb.length[1]];
      const bones = solveTwoBone(root, target, lengths, { bend: limb.bend, stretch: limb.stretch });
      const f = (p: Vec2) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`;
      return { ...limb, root, target, end: bones.end, joint: bones.joint, d: `M${f(root)} L${f(bones.joint)} L${f(bones.end)}`, bones };
    }
    const total = typeof limb.length === "number" ? limb.length : limb.length[0] + limb.length[1];
    const hose = rubberHose(root, target, total, { bend: limb.bend, stretch: limb.stretch });
    return { ...limb, root, target, end: hose.end, joint: hose.apex, d: hose.d, hose };
  });
  return { nulls: points, limbs: solved, frame };
}

/**
 * A character rig in the manner of Duik for After Effects: null objects
 * (animated with `ae-motion` tracks or expressions, and parentable) drive
 * two-bone IK limbs and rubber-hose limbs. Hoses keep their length and bow as
 * their ends meet; bones bend at a solved joint and can stretch to reach.
 * Draw heads, bodies and props from the solved positions in `renderUnder` /
 * `renderOver`.
 */
export const IkRig: React.FC<IkRigProps> = ({
  nulls,
  limbs,
  width = 960,
  height = 540,
  renderUnder,
  renderOver,
  color = "#f4f4f5",
  frame: frameOverride,
  style,
  className,
}) => {
  const current = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? current;
  const rig = useMemo(() => solveRig(nulls, limbs, frame, fps), [nulls, limbs, frame, fps]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={style}>
      {renderUnder?.(rig)}
      {rig.limbs.map((limb, i) => (
        // Limbs have no identity beyond their order in the rig.
        <g key={i}>
          <path
            d={limb.d}
            fill="none"
            stroke={limb.color ?? color}
            strokeWidth={limb.thickness ?? 14}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {limb.style === "bones" && (limb.jointRadius ?? 0) > 0 ? (
            <circle cx={limb.joint[0]} cy={limb.joint[1]} r={limb.jointRadius} fill={limb.color ?? color} />
          ) : null}
        </g>
      ))}
      {renderOver?.(rig)}
    </svg>
  );
};
