"use client";

import type { Keyframe, Vec2 } from "../../registry/bases/default/lib/ae-motion";
import { sampleTrack } from "../../registry/bases/default/lib/ae-motion";
import { followChain } from "../../registry/bases/default/lib/follow";
import { IkRig, type IkLimb, type IkNull, type SolvedRig } from "../../registry/bases/default/primitives/ik-rig";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * A desk lamp that pays attention.
 *
 * The orb drifts on a keyframed path with spatial bézier handles, looped with
 * `loopOut`. The lamp's head chases a spring-lagged copy of it
 * (`follow-through`), so it lags, overshoots and settles; a two-bone IK arm
 * solves the elbow; the base is a parent null that shuffles toward the orb,
 * and its rubber-hose power cord flexes as it does. The shade always aims at
 * the orb itself, so the lamp looks before it leans.
 */
const LOOP = 150;
const FLOOR = 452;
const METAL = "#d9d9df";

const ORB: Keyframe<Vec2>[] = [
  { frame: 0, value: [700, 190], spatialOut: [-60, 90] },
  { frame: 50, value: [590, 350], spatialIn: [-50, -60], spatialOut: [70, 50] },
  { frame: 100, value: [830, 310], spatialIn: [-40, 70], spatialOut: [40, -80] },
  { frame: LOOP, value: [700, 190], spatialIn: [60, -10] },
];
const orbAt = (frame: number): Vec2 => sampleTrack(ORB, frame, { loopOut: "cycle", loopIn: "cycle" });
/** The expression the head and base follow: the orb, a beat late. */
const orbExpression = ({ frame }: { frame: number }): Vec2 => orbAt(frame);
const lagged = (frame: number): Vec2 =>
  followChain(orbExpression, frame + LOOP, { links: 1, frequency: 1.1, damping: 0.5 })[1].position;

const baseX = (frame: number) => 300 + (lagged(frame)[0] - 700) * 0.14;
const SHOULDER_RISE = 24;
const REACH = 236;

const NULLS: Record<string, IkNull> = {
  base: { position: ({ frame }) => [baseX(frame), FLOOR] },
  shoulder: { parent: "base", position: [0, -SHOULDER_RISE] },
  cordStart: { parent: "base", position: [-56, -4] },
  plug: { position: [-60, 500] },
  head: {
    position: ({ frame }) => {
      const shoulder: Vec2 = [baseX(frame), FLOOR - SHOULDER_RISE];
      const target = lagged(frame);
      const dx = target[0] - shoulder[0];
      const dy = target[1] - shoulder[1];
      const k = REACH / Math.hypot(dx, dy);
      return [shoulder[0] + dx * k, shoulder[1] + dy * k];
    },
  },
};

const LIMBS: IkLimb[] = [
  { from: "cordStart", to: "plug", style: "hose", length: 360, bend: -1, thickness: 5, color: "#3a3a44" },
  { from: "shoulder", to: "head", style: "bones", length: [150, 150], bend: -1, thickness: 13, color: METAL, jointRadius: 11 },
];

const Under: React.FC<{ rig: SolvedRig }> = ({ rig }) => {
  const head = rig.nulls.head;
  const orb = orbAt(rig.frame + LOOP);
  const a = Math.atan2(orb[1] - head[1], orb[0] - head[0]);
  const far = Math.hypot(orb[0] - head[0], orb[1] - head[1]) + 220;
  const spread = 0.34;
  const p = (r: number, t: number) => `${head[0] + Math.cos(a + t) * r} ${head[1] + Math.sin(a + t) * r}`;
  return (
    <>
      <defs>
        <radialGradient id="ik-beam" cx={head[0]} cy={head[1]} r={far} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={DEMO_PALETTE.phosphor} stopOpacity={0.5} />
          <stop offset="1" stopColor={DEMO_PALETTE.phosphor} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ik-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={DEMO_PALETTE.phosphor} stopOpacity={0.35} />
          <stop offset="1" stopColor={DEMO_PALETTE.phosphor} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={FLOOR} width={960} height={540 - FLOOR} fill="#101016" />
      <line x1={0} y1={FLOOR} x2={960} y2={FLOOR} stroke="#26262e" strokeWidth={2} />
      <ellipse cx={orb[0]} cy={FLOOR + 6} rx={120} ry={16} fill="url(#ik-pool)" />
      <path d={`M${p(30, -spread)} L${p(far, -spread)} L${p(far, spread)} L${p(30, spread)} Z`} fill="url(#ik-beam)" />
      <ellipse cx={rig.nulls.base[0]} cy={FLOOR + 3} rx={78} ry={9} fill="#000" opacity={0.5} />
      <path
        d={`M${rig.nulls.base[0] - 64} ${FLOOR} Q${rig.nulls.base[0]} ${FLOOR - 40} ${rig.nulls.base[0] + 64} ${FLOOR} Z`}
        fill={METAL}
      />
    </>
  );
};

const Over: React.FC<{ rig: SolvedRig }> = ({ rig }) => {
  const head = rig.nulls.head;
  const orb = orbAt(rig.frame + LOOP);
  const angle = (Math.atan2(orb[1] - head[1], orb[0] - head[0]) * 180) / Math.PI;
  return (
    <>
      <g transform={`translate(${head[0]} ${head[1]}) rotate(${angle})`}>
        <path d="M-26 -16 L26 -40 Q34 0 26 40 L-26 16 Z" fill={METAL} />
        <path d="M22 -34 Q30 0 22 34" stroke={DEMO_PALETTE.phosphor} strokeWidth={6} fill="none" strokeLinecap="round" />
        <circle cx={-26} cy={0} r={15} fill={METAL} />
      </g>
      <circle cx={orb[0]} cy={orb[1]} r={70} fill={DEMO_PALETTE.phosphor} opacity={0.08} />
      <circle cx={orb[0]} cy={orb[1]} r={34} fill={DEMO_PALETTE.phosphor} opacity={0.18} />
      <circle cx={orb[0]} cy={orb[1]} r={15} fill={DEMO_PALETTE.phosphor} />
    </>
  );
};

export const IkRigPreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <IkRig
      nulls={NULLS}
      limbs={LIMBS}
      width={960}
      height={540}
      renderUnder={(rig) => <Under rig={rig} />}
      renderOver={(rig) => <Over rig={rig} />}
    />
  </PreviewFrame>
);
