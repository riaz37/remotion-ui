import { useId, useMemo, type CSSProperties, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnimatable, type Animatable, type Vec2 } from "@/remotion/lib/ae-motion";
import { inkAt, penAt, planPlot, type PenState, type PlotOptions, type PlotPlan } from "@/remotion/lib/pen-plot";
import { rubberHose, solveTwoBone } from "@/remotion/lib/rig";

/** Strokes for the arm to draw, and how the pen moves between them. */
export type IkPlot = PlotOptions & {
  /** SVG path data. Every subpath (every `M`) is one pen-down stroke, in order. */
  d: string | readonly string[];
};

/** Everything solved for one frame — what `renderArm` and friends draw from. */
export type IkPose = {
  frame: number;
  /** Shoulder: the base's world position. */
  base: Vec2;
  /** Solved elbow. */
  elbow: Vec2;
  /** Where the hand actually is. Equals `target` whenever the target is in reach. */
  hand: Vec2;
  /** Where the hand was asked to go. */
  target: Vec2;
  /** Degrees; heading of the upper arm and the forearm. */
  upperAngle: number;
  lowerAngle: number;
  lengths: readonly [number, number];
  /** Whether the hand is on the target (false when it is out of reach). */
  reached: boolean;
  /** Pen height, 0 on the paper to 1 raised. Always 1 without a plot. */
  lift: number;
  /** The plotter's pen, when plotting. */
  pen: PenState | null;
  /** Ink on the paper, one `d` per stroke. Empty without a plot. */
  ink: string[];
};

export type IkRigProps = {
  /** Shoulder position. Animate it (keyframes or an expression) to mount the arm on a rail or a body. */
  base: Animatable<Vec2>;
  /** Upper arm and forearm length, px. */
  lengths?: readonly [number, number];
  /** What the hand reaches for. Ignored when `plot` is set. */
  target?: Animatable<Vec2>;
  /** Strokes the hand draws with a pen; the ink is laid exactly where the hand is. */
  plot?: IkPlot;
  /** Which side the elbow folds to. Fixed for the whole shot, so it can never flip. */
  bend?: 1 | -1;
  /** Share of the reach (0–1) over which the arm eases into full extension instead of snapping straight. */
  softness?: number;
  /** Upper-arm width, px. The rest of the arm is proportioned from it. */
  thickness?: number;
  /** Anodised body colour of the arm. */
  armColor?: string;
  /** Status light and pen-down glow. */
  accentColor?: string;
  inkColor?: string;
  inkWidth?: number;
  /** Bloom on the ink, 0–1. */
  glow?: number;
  /** Direction the key light comes from, degrees (screen space, 0 = from the right, -90 = from above). */
  lightAngle?: number;
  /** Opacity of the arm's cast shadows. 0 hides them. */
  shadow?: number;
  /** The slack service cable from base to elbow. */
  cable?: boolean;
  /** Replaces the built-in arm. Ink and `renderUnder` still draw underneath. */
  renderArm?: (pose: IkPose) => ReactNode;
  /** Drawn under the ink — paper, beds, rails. */
  renderUnder?: (pose: IkPose) => ReactNode;
  /** Drawn over everything. */
  renderOver?: (pose: IkPose) => ReactNode;
  width?: number;
  height?: number;
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

type SolveInput = {
  base: Animatable<Vec2>;
  lengths: readonly [number, number];
  target?: Animatable<Vec2>;
  plan?: PlotPlan | null;
  bend?: 1 | -1;
  softness?: number;
};

/**
 * Solve the arm for one frame. Pure — use it to drive anything else off the
 * rig (a camera that follows the hand, a second arm, sparks at the nib).
 */
export function solveIkPose(
  { base, lengths, target, plan, bend = 1, softness = 0 }: SolveInput,
  frame: number,
  fps: number,
): IkPose {
  const root = resolveAnimatable(base, frame, { fps });
  const pen = plan ? penAt(plan, frame) : null;
  const aim: Vec2 | null = pen ? pen.position : target === undefined ? null : resolveAnimatable(target, frame, { fps });
  if (!aim) throw new Error("IkRig: pass a `target` to reach for or a `plot` to draw.");
  const solved = solveTwoBone(root, aim, lengths, { bend, softness });
  return {
    frame,
    base: root,
    elbow: solved.joint,
    hand: solved.end,
    target: aim,
    upperAngle: solved.upperAngle,
    lowerAngle: solved.lowerAngle,
    lengths,
    reached: Math.hypot(solved.end[0] - aim[0], solved.end[1] - aim[1]) < 0.05,
    lift: pen ? pen.lift : 1,
    pen,
    ink: plan ? inkAt(plan, frame) : [],
  };
}

// ------------------------------------------------------------------ shading

const hex = (c: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const k = Math.min(1, Math.max(0, t));
  const ch = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, "0");
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
};
/** Lit or shaded version of the body colour for a surface facing `facing` (-1 away … 1 toward the light). */
const shade = (base: string, facing: number) =>
  facing >= 0 ? mix(base, "#ffffff", 0.42 * facing) : mix(base, "#000000", 0.55 * -facing);

const DEG = Math.PI / 180;
const f2 = (n: number) => +n.toFixed(2);

/** A link from (0,0) to (length,0), `w0` wide at the root tapering to `w1`, round-ended. */
const linkPath = (length: number, w0: number, w1: number) => {
  const r0 = w0 / 2;
  const r1 = w1 / 2;
  return `M0 ${f2(-r0)} L${f2(length)} ${f2(-r1)} A${f2(r1)} ${f2(r1)} 0 0 1 ${f2(length)} ${f2(r1)} L0 ${f2(r0)} A${f2(r0)} ${f2(r0)} 0 0 1 0 ${f2(-r0)} Z`;
};

type ArmLook = {
  id: string;
  thickness: number;
  armColor: string;
  accentColor: string;
  inkColor: string;
  lightAngle: number;
  shadow: number;
  cable: boolean;
  bend: 1 | -1;
};

/** A machined hub: rim, face, and a slotted screw that turns with its link. */
const Hub: React.FC<{ at: Vec2; r: number; angle: number; color: string; light: Vec2 }> = ({ at, r, angle, color, light }) => (
  <g transform={`translate(${f2(at[0])} ${f2(at[1])})`}>
    <circle r={r} fill={shade(color, -0.35)} />
    <circle r={r * 0.86} fill={color} />
    <circle
      r={r * 0.86}
      fill="none"
      stroke={shade(color, 0.9)}
      strokeWidth={r * 0.08}
      strokeDasharray={`${f2(r * 0.86 * Math.PI * 0.9)} ${f2(r * 0.86 * Math.PI * 1.1)}`}
      transform={`rotate(${f2(Math.atan2(light[1], light[0]) / DEG - 81)})`}
    />
    <circle r={r * 0.36} fill={shade(color, -0.6)} />
    <rect
      x={-r * 0.3}
      y={-r * 0.06}
      width={r * 0.6}
      height={r * 0.12}
      rx={r * 0.06}
      fill={shade(color, 0.5)}
      transform={`rotate(${f2(angle)})`}
    />
  </g>
);

/** A hairline of reflected key light along whichever long edge faces the light. */
const Specular: React.FC<{ length: number; w0: number; w1: number; facing: number; color: string }> = ({ length, w0, w1, facing, color }) => {
  const side = facing >= 0 ? -1 : 1;
  const inset = 0.36;
  return (
    <line
      x1={w0 * 0.3}
      y1={side * w0 * inset}
      x2={length - w1 * 0.3}
      y2={side * w1 * inset}
      stroke={mix(color, "#ffffff", 0.75)}
      strokeOpacity={0.15 + 0.5 * Math.abs(facing)}
      strokeWidth={Math.max(1, w0 * 0.035)}
      strokeLinecap="round"
    />
  );
};

const DefaultArm: React.FC<{ pose: IkPose; look: ArmLook }> = ({ pose, look }) => {
  const { id, thickness: w, armColor, accentColor, inkColor, lightAngle, shadow, cable, bend } = look;
  const light: Vec2 = [Math.cos(lightAngle * DEG), Math.sin(lightAngle * DEG)];
  const cast: Vec2 = [-light[0], -light[1]];
  const [a, b] = pose.lengths;
  const upper = { from: pose.base, angle: pose.upperAngle, length: a, w0: w, w1: w * 0.82 };
  const fore = { from: pose.elbow, angle: pose.lowerAngle, length: Math.hypot(pose.hand[0] - pose.elbow[0], pose.hand[1] - pose.elbow[1]), w0: w * 0.7, w1: w * 0.52 };
  const lift = Math.max(0, pose.lift);
  // Heights above the paper, as shadow offsets: the higher the part, the further its shadow falls.
  const height = { base: w * 0.18, cable: w * 0.3, upper: w * 0.42, fore: w * 0.62, head: w * (0.72 + 0.34 * lift) };
  const off = (h: number) => `translate(${f2(cast[0] * h)} ${f2(cast[1] * h)})`;
  const at = (p: Vec2, angle: number) => `translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(angle)})`;

  // Surfaces facing the light: the link's upper edge normal is its heading rotated -90°.
  const facing = (angle: number) => Math.sin(angle * DEG) * light[0] - Math.cos(angle * DEG) * light[1];
  const gradient = (key: string, angle: number, width: number) => {
    const f = facing(angle);
    return (
      <linearGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" x1={0} y1={-width / 2} x2={0} y2={width / 2}>
        <stop offset={0} stopColor={shade(armColor, f)} />
        <stop offset={0.16} stopColor={shade(armColor, 0.35 * f + 0.1)} />
        <stop offset={0.5} stopColor={armColor} />
        <stop offset={0.86} stopColor={shade(armColor, -0.2)} />
        <stop offset={1} stopColor={shade(armColor, -f * 0.9 - 0.2)} />
      </linearGradient>
    );
  };

  const anchor: Vec2 = [pose.base[0] - light[0] * w * 1.05, pose.base[1] - light[1] * w * 1.05];
  const hose = cable ? rubberHose(anchor, pose.elbow, a * 1.08 + w * 1.4, { bend: bend === 1 ? -1 : 1 }) : null;
  const headLen = w * 1.1;
  const headW = w * 0.62;
  const scale = 1 + 0.06 * lift;
  const down = 1 - Math.min(1, lift * 4);

  const silhouettes = (
    <>
      <circle cx={pose.base[0]} cy={pose.base[1]} r={w * 1.2} transform={off(height.base)} />
      {hose ? <path d={hose.d} transform={off(height.cable)} fill="none" stroke="#000" strokeWidth={w * 0.16} /> : null}
      <path d={linkPath(upper.length, upper.w0, upper.w1)} transform={`${off(height.upper)} ${at(upper.from, upper.angle)}`} />
      <path d={linkPath(fore.length, fore.w0, fore.w1)} transform={`${off(height.fore)} ${at(fore.from, fore.angle)}`} />
      <rect
        x={-headLen * 0.62}
        y={-headW / 2}
        width={headLen}
        height={headW}
        rx={headW * 0.34}
        transform={`${off(height.head)} ${at(pose.hand, pose.lowerAngle)} scale(${f2(scale)})`}
      />
      {/* The nib's own shadow: it meets the nib when the pen touches down. */}
      <circle cx={pose.hand[0]} cy={pose.hand[1]} r={w * 0.1} transform={off(w * 0.9 * lift)} />
    </>
  );

  return (
    <g>
      <defs>
        {gradient("upper", upper.angle, upper.w0)}
        {gradient("fore", fore.angle, fore.w0)}
        {gradient("head", pose.lowerAngle, headW)}
        <radialGradient id={`${id}-base`} cx={0.5 - light[0] * 0.18} cy={0.5 - light[1] * 0.18} r={0.62}>
          <stop offset={0} stopColor={shade(armColor, 0.25)} />
          <stop offset={1} stopColor={shade(armColor, -0.55)} />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={w * 0.16} />
        </filter>
        <radialGradient id={`${id}-nib`}>
          <stop offset={0} stopColor={inkColor} stopOpacity={0.9} />
          <stop offset={1} stopColor={inkColor} stopOpacity={0} />
        </radialGradient>
      </defs>

      {shadow > 0 ? (
        <g filter={`url(#${id}-shadow)`} fill="#000" opacity={shadow}>
          {silhouettes}
        </g>
      ) : null}

      {/* Base: fixed plate, and a turret that turns with the upper arm. */}
      <circle cx={pose.base[0]} cy={pose.base[1]} r={w * 1.2} fill={`url(#${id}-base)`} />
      <circle cx={pose.base[0]} cy={pose.base[1]} r={w * 1.2} fill="none" stroke={shade(armColor, 0.55)} strokeOpacity={0.35} strokeWidth={1} />
      <g transform={at(pose.base, pose.upperAngle)}>
        <circle r={w * 0.9} fill={shade(armColor, -0.25)} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle key={deg} cx={Math.cos(deg * DEG) * w * 0.7} cy={Math.sin(deg * DEG) * w * 0.7} r={w * 0.055} fill={shade(armColor, 0.45)} />
        ))}
      </g>

      {hose ? (
        <g fill="none" strokeLinecap="round">
          <path d={hose.d} stroke={shade(armColor, -0.7)} strokeWidth={w * 0.16} />
          <path d={hose.d} stroke={shade(armColor, 0.3)} strokeWidth={w * 0.035} strokeOpacity={0.6} transform={`translate(${f2(light[0] * w * 0.03)} ${f2(light[1] * w * 0.03)})`} />
        </g>
      ) : null}

      <g transform={at(upper.from, upper.angle)}>
        <path d={linkPath(upper.length, upper.w0, upper.w1)} fill={`url(#${id}-upper)`} />
        <Specular length={upper.length} w0={upper.w0} w1={upper.w1} facing={facing(upper.angle)} color={armColor} />
        <line x1={w * 0.8} y1={0} x2={upper.length - w * 0.7} y2={0} stroke={shade(armColor, -0.6)} strokeWidth={w * 0.09} strokeLinecap="round" />
      </g>
      <Hub at={pose.base} r={w * 0.5} angle={pose.upperAngle} color={armColor} light={light} />

      <g transform={at(fore.from, fore.angle)}>
        <path d={linkPath(fore.length, fore.w0, fore.w1)} fill={`url(#${id}-fore)`} />
        <Specular length={fore.length} w0={fore.w0} w1={fore.w1} facing={facing(fore.angle)} color={armColor} />
        <line x1={w * 0.6} y1={0} x2={Math.max(w * 0.6, fore.length - w * 0.9)} y2={0} stroke={shade(armColor, -0.6)} strokeWidth={w * 0.07} strokeLinecap="round" />
      </g>
      <Hub at={pose.elbow} r={w * 0.4} angle={pose.lowerAngle} color={armColor} light={light} />

      {/* Pen head: grows a touch as it lifts toward the camera. */}
      <g transform={`${at(pose.hand, pose.lowerAngle)} scale(${f2(scale)})`}>
        <rect x={-headLen * 0.62} y={-headW / 2} width={headLen} height={headW} rx={headW * 0.34} fill={`url(#${id}-head)`} />
        <rect x={-headLen * 0.5} y={-headW * 0.3} width={headLen * 0.2} height={headW * 0.08} rx={headW * 0.04} fill={accentColor} opacity={0.3 + 0.7 * down} />
        <circle cx={0} cy={0} r={w * 0.17} fill={shade(armColor, -0.7)} />
      </g>
      <circle cx={pose.hand[0]} cy={pose.hand[1]} r={w * 0.62} fill={`url(#${id}-nib)`} opacity={0.55 * down} />
      <circle cx={pose.hand[0]} cy={pose.hand[1]} r={w * 0.075} fill={mix(shade(armColor, -0.7), mix(inkColor, "#ffffff", 0.45), down)} />
    </g>
  );
};

/**
 * A two-bone IK arm, built like a SCARA plotter. Give it a `target` and it
 * reaches for it; give it a `plot` and it draws the strokes with a pen, the
 * ink landing exactly where the solved hand is. The elbow is a closed-form
 * law-of-cosines solve every frame, so there is no drift and no jitter; the
 * bend side is fixed, so the elbow never flips; soft IK stops the arm popping
 * straight when a target runs out of reach. Animate `base` to put the arm on
 * a rail or a character.
 */
export const IkRig: React.FC<IkRigProps> = ({
  base,
  lengths = [220, 200],
  target,
  plot,
  bend = 1,
  softness = 0.08,
  thickness = 34,
  armColor = "#80848f",
  accentColor = "#2dd4bf",
  inkColor = "#e8b86d",
  inkWidth = 4,
  glow = 0.6,
  lightAngle = -125,
  shadow = 0.55,
  cable = true,
  renderArm,
  renderUnder,
  renderOver,
  width = 960,
  height = 540,
  frame: frameOverride,
  style,
  className,
}) => {
  const current = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? current;
  const id = `ik${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Plans are keyed by content, so an inline `plot={{ … }}` is planned once, not every frame.
  const plotKey = plot ? JSON.stringify(plot) : "";
  const plan = useMemo(() => {
    if (!plot) return null;
    const { d, ...options } = plot;
    return planPlot(d, options, fps);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plotKey is plot's content
  }, [plotKey, fps]);

  const pose = solveIkPose({ base, lengths, target, plan, bend, softness }, frame, fps);
  const look: ArmLook = { id, thickness, armColor, accentColor, inkColor, lightAngle, shadow, cable, bend };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={style}>
      <defs>
        <filter id={`${id}-glow`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={inkWidth * 1.6} />
        </filter>
      </defs>
      {renderUnder?.(pose)}
      {pose.ink.length > 0 ? (
        <g fill="none" stroke={inkColor} strokeLinecap="round" strokeLinejoin="round">
          {glow > 0 ? (
            <g filter={`url(#${id}-glow)`} opacity={glow * 0.7}>
              {pose.ink.map((d, i) => (
                // Strokes have no identity beyond their order in the plot.
                <path key={i} d={d} strokeWidth={inkWidth * 2.2} />
              ))}
            </g>
          ) : null}
          {pose.ink.map((d, i) => (
            <path key={i} d={d} strokeWidth={inkWidth} />
          ))}
        </g>
      ) : null}
      {renderArm ? renderArm(pose) : <DefaultArm pose={pose} look={look} />}
      {renderOver?.(pose)}
    </svg>
  );
};
