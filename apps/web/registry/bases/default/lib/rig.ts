import type { Vec2 } from "./ae-motion";

/**
 * Character-rig maths, the way Duik does it in After Effects: two-bone
 * inverse kinematics for jointed limbs, and rubber-hose limbs whose length
 * stays constant so they bow when the ends come together. Pure functions of
 * positions — feed them null positions from `ae-motion` tracks.
 */

export type TwoBoneOptions = {
  /** Which side the joint bends to: 1 clockwise of the root→target line, -1 the other. */
  bend?: 1 | -1;
  /** Let the bones lengthen to reach a target that is too far away. */
  stretch?: boolean;
  /** Largest stretch factor. */
  maxStretch?: number;
  /**
   * Soft IK: the share of the chain's reach (0–1) over which the limb eases
   * into full extension instead of locking straight. Without it the joint
   * angle's velocity goes to infinity as the target reaches the limit — the
   * visible "knee pop". 0 is the hard law-of-cosines solve.
   */
  softness?: number;
};

export type TwoBoneSolution = {
  root: Vec2;
  /** The elbow / knee. */
  joint: Vec2;
  /** Where the chain ends — the target, or as close as it can get. */
  end: Vec2;
  /** Degrees; heading of the upper and lower bone. */
  upperAngle: number;
  lowerAngle: number;
  /** Bone lengths after any stretch. */
  lengths: [number, number];
  /** 1 = unstretched. */
  stretch: number;
  /** Whether the end actually reaches the target. */
  reached: boolean;
};

const DEG = 180 / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Soft reach (Andy Nicholas' soft IK): distances inside the hard zone pass
 * through; past it they approach the full length exponentially, with matching
 * slope at the join, so the end effector decelerates into full extension
 * rather than slamming into it.
 */
export function softReach(distance: number, length: number, softness: number): number {
  const soft = clamp(softness, 0, 1) * length;
  if (soft <= 1e-9) return Math.min(distance, length);
  const hard = length - soft;
  if (distance <= hard) return distance;
  return hard + soft * (1 - Math.exp(-(distance - hard) / soft));
}

/**
 * Law-of-cosines two-bone IK. Out-of-reach targets either stretch the chain
 * (up to `maxStretch`) or leave it pointing straight at the target; targets
 * closer than the bones can fold are pushed out to the nearest reachable
 * distance so the joint never flips through the root. `softness` rounds off
 * the approach to full extension so the joint never pops straight.
 */
export function solveTwoBone(
  root: Vec2,
  target: Vec2,
  lengths: readonly [number, number],
  { bend = 1, stretch = false, maxStretch = 1.5, softness = 0 }: TwoBoneOptions = {},
): TwoBoneSolution {
  const [a0, b0] = lengths;
  if (!(a0 > 0) || !(b0 > 0)) throw new Error("rig: bone lengths must be positive.");
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const distance = Math.hypot(dx, dy);
  const heading = distance > 1e-9 ? Math.atan2(dy, dx) : 0;

  // Soft IK shortens the distance the chain aims for; stretch then lengthens
  // the bones by exactly the shortfall, so a soft, stretchy limb still lands.
  const cap = Math.max(1, maxStretch);
  let factor = 1;
  let wanted = distance;
  if (softness > 0) {
    const aimed = softReach(distance, a0 + b0, softness);
    if (stretch && aimed > 1e-9) factor = Math.min(distance / aimed, cap);
    wanted = aimed * factor;
  } else if (stretch && distance > a0 + b0) {
    factor = Math.min(distance / (a0 + b0), cap);
  }
  const a = a0 * factor;
  const b = b0 * factor;
  const reach = clamp(wanted, Math.abs(a - b) + 1e-6, a + b - 1e-9);
  const cosRoot = clamp((a * a + reach * reach - b * b) / (2 * a * reach), -1, 1);
  const upper = heading + bend * Math.acos(cosRoot);
  const joint: Vec2 = [root[0] + Math.cos(upper) * a, root[1] + Math.sin(upper) * a];
  const end: Vec2 = [root[0] + Math.cos(heading) * reach, root[1] + Math.sin(heading) * reach];
  return {
    root,
    joint,
    end,
    upperAngle: upper * DEG,
    lowerAngle: Math.atan2(end[1] - joint[1], end[0] - joint[0]) * DEG,
    lengths: [a, b],
    stretch: factor,
    reached: Math.abs(reach - distance) < 1e-3,
  };
}

export type HoseOptions = {
  /** Which side the hose bows to, as for `solveTwoBone`. */
  bend?: 1 | -1;
  /** Let the hose stretch straight past its length instead of stopping short. */
  stretch?: boolean;
};

export type HoseSolution = {
  /** SVG path from root to end. */
  d: string;
  /** Midpoint of the hose — where an elbow would be. */
  apex: Vec2;
  /** Where the hose ends (the target, or as far as it reaches). */
  end: Vec2;
  /** Degrees; direction the hose leaves the root and arrives at the end. */
  startAngle: number;
  endAngle: number;
  /** Arc radius; Infinity when straight. */
  radius: number;
};

/**
 * A rubber-hose limb: a circular arc of fixed length between two points.
 * Brought closer together, the ends make the hose bow into a tighter arc —
 * the hose never shrinks, it curls, which is the whole look. The arc's half
 * angle φ solves chord = length · sin(φ) / φ (monotonic on (0, π), so a
 * bisection is exact to float precision).
 */
export function rubberHose(
  root: Vec2,
  target: Vec2,
  length: number,
  { bend = 1, stretch = false }: HoseOptions = {},
): HoseSolution {
  if (!(length > 0)) throw new Error("rig: hose length must be positive.");
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const chord = Math.hypot(dx, dy);
  const heading = chord > 1e-9 ? Math.atan2(dy, dx) : 0;
  const fmt = (n: number) => +n.toFixed(3);

  if (chord >= length * 0.9995) {
    const reach = stretch ? chord : Math.min(chord, length);
    const end: Vec2 = [root[0] + Math.cos(heading) * reach, root[1] + Math.sin(heading) * reach];
    return {
      d: `M${fmt(root[0])} ${fmt(root[1])} L${fmt(end[0])} ${fmt(end[1])}`,
      apex: [(root[0] + end[0]) / 2, (root[1] + end[1]) / 2],
      end,
      startAngle: heading * DEG,
      endAngle: heading * DEG,
      radius: Infinity,
    };
  }

  const ratio = Math.max(1e-6, chord / length);
  let lo = 1e-9;
  let hi = Math.PI - 1e-9;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (Math.sin(mid) / mid > ratio) lo = mid;
    else hi = mid;
  }
  const phi = (lo + hi) / 2;
  const radius = length / (2 * phi);
  // Normal pointing to the bend side (y-down: clockwise of the heading for bend 1).
  const nx = -Math.sin(heading) * bend;
  const ny = Math.cos(heading) * bend;
  const mx = (root[0] + target[0]) / 2;
  const my = (root[1] + target[1]) / 2;
  const sagitta = radius * (1 - Math.cos(phi));
  const apex: Vec2 = [mx + nx * sagitta, my + ny * sagitta];
  const largeArc = phi > Math.PI / 2 ? 1 : 0;
  const sweep = bend === 1 ? 0 : 1;
  return {
    d:
      `M${fmt(root[0])} ${fmt(root[1])} ` +
      `A${fmt(radius)} ${fmt(radius)} 0 ${largeArc} ${sweep} ${fmt(target[0])} ${fmt(target[1])}`,
    apex,
    end: target,
    startAngle: (heading + bend * phi) * DEG,
    endAngle: (heading - bend * phi) * DEG,
    radius,
  };
}
