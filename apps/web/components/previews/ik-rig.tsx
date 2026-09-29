"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Vec2 } from "../../registry/bases/default/lib/ae-motion";
import { smoothThrough, toD, type BezierPath, type Pt } from "../../registry/bases/default/lib/bezier-path";
import { backInOut, penAt, planPlot, type PlotOptions } from "../../registry/bases/default/lib/pen-plot";
import { IkRig, solveIkPose, type IkPlot, type IkPose } from "../../registry/bases/default/primitives/ik-rig";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * A rail-mounted SCARA plotter signs "motion".
 *
 * The word is one continuous cursive stroke; the pen flicks out of the n into
 * an underline drawn right to left, then crosses the t and dots the i. The arm is pure two-bone IK: the pen is the
 * target, and the ink is laid where the solved hand is, so a wrong elbow would
 * show as ink leaving the nib. The pen stops dead in every cusp, lifts and
 * travels with anticipation and overshoot between strokes, and drops with a
 * small rebound. The base rides a rail on an expression that trails the pen,
 * so the arm keeps working the middle of its reach. The shot opens mid-word
 * and ends parked, with the camera still drifting in.
 */

/** Preview frame rate. The plan below is built for it once, at module load. */
const FPS = 30;
/** Where the design's baseline starts on the bed, px. */
const ORIGIN: Vec2 = [226, 296];
const RAIL_Y = 472;
const SLANT = 0.24;

type P = readonly [number, number];
/**
 * Letterforms as Catmull-Rom runs (x right, y up, baseline 0, x-height 80).
 * A new run starts at every cusp, so the curve keeps its corner there and the
 * planner brakes into it, as a pen does.
 */
const MAIN: P[][] = [
  [[-22, 2], [-8, 34], [6, 66], [18, 80], [28, 72], [31, 44], [31, 0]],
  [[31, 0], [33, 46], [42, 72], [54, 80], [65, 72], [69, 44], [69, 0]],
  [[69, 0], [71, 46], [80, 72], [92, 80], [103, 72], [107, 44], [107, 14], [113, 2], [125, 2], [138, 20], [146, 46], [156, 70], [170, 81], [184, 82]],
  [[184, 82], [167, 76], [156, 54], [156, 22], [167, 2], [184, 0], [198, 16], [200, 46], [194, 72], [184, 82], [194, 70], [210, 70], [226, 80], [242, 108], [252, 134]],
  [[252, 134], [247, 90], [244, 40], [245, 12], [252, 1], [265, 3], [278, 26], [288, 58], [294, 80]],
  [[294, 80], [290, 44], [289, 14], [295, 2], [307, 2], [320, 20], [328, 46], [338, 70], [352, 81], [366, 82]],
  [[366, 82], [349, 76], [338, 54], [338, 22], [349, 2], [366, 0], [380, 16], [382, 46], [376, 72], [366, 82], [376, 70], [390, 70], [404, 78], [412, 66], [414, 40], [414, 0]],
  [[414, 0], [416, 46], [425, 72], [437, 80], [448, 72], [452, 44], [452, 14], [458, 2], [472, 2], [490, 16], [506, 38]],
];
const T_CROSS: P[][] = [[[222, 94], [246, 96], [272, 100]]];
const I_DOT: P[][] = [[[300, 106], [304, 112]]];
/** Drawn right to left, flicked straight out of the n's tail. */
const UNDERLINE: P[][] = [[[534, -14], [484, -26], [370, -30], [220, -26], [80, -24], [-30, -30]]];

const toBed = ([x, y]: P): Pt => ({ x: ORIGIN[0] + x + y * SLANT, y: ORIGIN[1] - y });
const stroke = (runs: P[][]) => {
  const path: BezierPath = { segments: runs.flatMap((run) => smoothThrough(run.map(toBed), false).segments), closed: false };
  return toD(path);
};

const PLOT_OPTIONS: PlotOptions = {
  speed: 720,
  travelSpeed: 1200,
  ramp: 6,
  liftFrames: 5,
  minTravelFrames: 12,
  overshoot: 0.9,
  park: [852, 246],
};
const STROKES = [MAIN, UNDERLINE, T_CROSS, I_DOT].map(stroke);

/**
 * Plan frame the shot opens on: the first frame the pen is past the "o",
 * heading up into the t. Found from the plan, so retuning speeds keeps f0
 * on the same moment of the word.
 */
const PREROLL = (() => {
  const draft = planPlot(STROKES, PLOT_OPTIONS, FPS);
  const tStemTop = toBed(MAIN[3][MAIN[3].length - 1]);
  for (let f = 0; f < draft.end; f += 1) {
    const pen = penAt(draft, f);
    if (pen.stroke === 0 && pen.position[1] < tStemTop.y + 40 && pen.position[0] > toBed(MAIN[3][0]).x + 20) return f;
  }
  return 0;
})();

export const IK_RIG_PLOT: IkPlot = { d: STROKES, ...PLOT_OPTIONS, startFrame: -PREROLL };

/** The same plan the component builds; the rail and camera read the pen from it. */
export const IK_RIG_PLAN = planPlot(IK_RIG_PLOT.d, { ...PLOT_OPTIONS, startFrame: -PREROLL }, FPS);

/** Mean pen x over a window, sampled every 2 frames — a smooth follower with no state. */
const smoothedPen = (frame: number, radius: number): Vec2 => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let k = -radius; k <= radius; k += 2) {
    const p = penAt(IK_RIG_PLAN, frame + k).position;
    x += p[0];
    y += p[1];
    n += 1;
  }
  return [x / n, y / n];
};

/** Rail station the sled returns to for the closing pose, under the "on". */
const REST_X = 628;
const PARK_MOVE = IK_RIG_PLAN.phases[IK_RIG_PLAN.phases.length - 1];

/**
 * The base trails the pen along the rail, a little to its right so the arm
 * never covers fresh ink. For the closing move it hands over to its own
 * eased move to a rest station, landing on the same frame as the pen — so the
 * last move has one shared anticipation, overshoot and settle, and nothing
 * drifts after it.
 */
export const railBase = ({ frame }: { frame: number }): Vec2 => {
  const follow = smoothedPen(frame, 24)[0] + 44;
  const u = (frame - PARK_MOVE.t0) / (PARK_MOVE.t1 - PARK_MOVE.t0);
  if (u <= 0) return [follow, RAIL_Y];
  if (u >= 1) return [REST_X, RAIL_Y];
  // Blended over the live follower, not started from rest: the ease's zero
  // slope at 0 keeps the sled's velocity continuous through the handover.
  return [follow + (REST_X - follow) * backInOut(u, PLOT_OPTIONS.overshoot ?? 0), RAIL_Y];
};

export const ARM = { lengths: [206, 190] as const, bend: 1 as const, softness: 0.08 };

/**
 * What the camera frames: the middle of the word, pulled toward the centroid
 * of the rig itself (base, elbow and hand), averaged over a window so it
 * drifts rather than twitches. Reads the pose through `solveIkPose`, the same
 * solve the component draws.
 */
const WORD_CENTRE: Vec2 = [476, 256];
const cameraTarget = (frame: number): Vec2 => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let k = -30; k <= 30; k += 3) {
    const pose = solveIkPose({ ...ARM, base: railBase, plan: IK_RIG_PLAN }, frame + k, FPS);
    x += (pose.base[0] + pose.elbow[0] + pose.hand[0]) / 3;
    y += (pose.base[1] + pose.elbow[1] + pose.hand[1]) / 3;
    n += 1;
  }
  return [WORD_CENTRE[0] * 0.68 + (x / n) * 0.32, WORD_CENTRE[1] * 0.6 + (y / n) * 0.4];
};

const BED = "#0a0b10";
const SHEET = "#0f1016";
const HAIRLINE = "#23252e";

const Bed: React.FC<{ pose: IkPose }> = ({ pose }) => {
  const nib = pose.hand;
  return (
    <>
      <defs>
        <pattern id="ik-grid" width={24} height={24} patternUnits="userSpaceOnUse">
          <circle cx={12} cy={12} r={0.9} fill="#1b1d25" />
        </pattern>
        <radialGradient id="ik-pool" cx={nib[0]} cy={nib[1]} r={220} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={DEMO_PALETTE.phosphor} stopOpacity={0.07 * (1 - Math.min(1, pose.lift))} />
          <stop offset={1} stopColor={DEMO_PALETTE.phosphor} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="ik-rail" x1={0} y1={RAIL_Y - 22} x2={0} y2={RAIL_Y + 22} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#07080b" />
          <stop offset={0.5} stopColor="#111217" />
          <stop offset={1} stopColor="#07080b" />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={2160} height={1740} fill={BED} />
      <rect x={-600} y={-600} width={2160} height={1740} fill="url(#ik-grid)" />
      {/* The sheet, squared to the bed, with registration corners. */}
      <rect x={130} y={112} width={700} height={292} fill={SHEET} stroke={HAIRLINE} strokeWidth={1} />
      <g stroke="#34363f" strokeWidth={1.2} fill="none">
        {[
          [130, 112, 1, 1],
          [830, 112, -1, 1],
          [130, 404, 1, -1],
          [830, 404, -1, -1],
        ].map(([x, y, sx, sy]) => (
          <path key={`${x}-${y}`} d={`M${x - sx * 14} ${y} H${x + sx * 10} M${x} ${y - sy * 14} V${y + sy * 10}`} />
        ))}
      </g>
      <rect x={-600} y={-600} width={2160} height={1740} fill="url(#ik-pool)" />
      {/* Linear rail with a travel scale. */}
      <rect x={-600} y={RAIL_Y - 22} width={2160} height={44} fill="url(#ik-rail)" />
      <g stroke="#3b3e49" strokeWidth={2}>
        <line x1={-600} y1={RAIL_Y - 15} x2={1560} y2={RAIL_Y - 15} />
        <line x1={-600} y1={RAIL_Y + 15} x2={1560} y2={RAIL_Y + 15} />
      </g>
      <g stroke="#262831" strokeWidth={1}>
        {Array.from({ length: 81 }, (_, i) => -600 + i * 27).map((x, i) => (
          <line key={x} x1={x} y1={RAIL_Y + 22} x2={x} y2={RAIL_Y + (i % 5 === 0 ? 34 : 28)} />
        ))}
      </g>
      {/* The sled the base rides on. */}
      <g transform={`translate(${pose.base[0].toFixed(2)} ${RAIL_Y})`}>
        <rect x={-74} y={-30} width={148} height={60} rx={8} fill="#15161c" stroke="#2c2e37" strokeWidth={1} />
        {[-60, 60].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-18} r={3} fill="#3a3c46" />
            <circle cx={x} cy={18} r={3} fill="#3a3c46" />
          </g>
        ))}
      </g>
    </>
  );
};

/** Frame the arm comes to rest in its park pose (the plan's frames are the shot's frames). */
export const IK_RIG_SETTLED = Math.ceil(IK_RIG_PLAN.end);

export const IkRigPreview: React.FC = () => {
  const frame = useCurrentFrame();
  // Camera: pushes in and flattens its tilt over the shot, and leans a third of the way toward the pen.
  const t = interpolate(frame, [0, IK_RIG_SETTLED + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const [camX, camY] = cameraTarget(frame);
  const zoom = 1.03 + 0.08 * t;
  const tilt = 20 - 9 * t;

  return (
    <PreviewFrame lane="motion" padding={0} backgroundColor={BED}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 50%",
          transform: `perspective(1500px) rotateX(${tilt.toFixed(3)}deg) scale(${zoom.toFixed(4)}) translate(${(480 - camX).toFixed(2)}px, ${(270 - camY).toFixed(2)}px)`,
        }}
      >
        <IkRig
          base={railBase}
          lengths={ARM.lengths}
          plot={IK_RIG_PLOT}
          bend={ARM.bend}
          softness={ARM.softness}
          thickness={42}
          inkColor={DEMO_PALETTE.phosphor}
          accentColor={DEMO_PALETTE.teal}
          width={960}
          height={540}
          style={{ overflow: "visible" }}
          renderUnder={(pose) => <Bed pose={pose} />}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </PreviewFrame>
  );
};
