"use client";

import { useId } from "react";
import {
  easyEase,
  sampleTrack,
  type Animatable,
  type Keyframe,
  type Vec2,
} from "../../registry/bases/default/lib/ae-motion";
import { smoothThrough, toD } from "../../registry/bases/default/lib/bezier-path";
import { FollowThrough, type FollowLink } from "../../registry/bases/default/primitives/follow-through";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * Three tails on one staccato leader.
 *
 * The leader dashes between stops with Easy Ease — it arrives and halts dead —
 * which is exactly what shows follow-through: the chain keeps going after the
 * head has stopped. Teal is critically damped with a per-link `delay`, so it
 * snakes along the leader's exact path; rose is underdamped and swings past
 * every stop; phosphor is a looser spring that softens toward its tail
 * (`falloff`) like a whip. Each ribbon is its spine
 * drawn as layered, trimmed strokes, so it tapers from head to tail.
 */
const LOOP = 150;
const SIZE = { width: 960, height: 540 };

const STOPS: Array<[number, Vec2]> = [
  [0, [190, 300]],
  [22, [470, 150]],
  [46, [770, 290]],
  [72, [600, 420]],
  [98, [300, 400]],
  [124, [430, 230]],
  [LOOP, [190, 300]],
];
const LEADER_TRACK: Keyframe<Vec2>[] = STOPS.map(([frame, value]) => easyEase(frame, value, 0.55));

/** The leader shifted vertically, so the three tails sit apart. */
const shifted =
  (dy: number): Animatable<Vec2> =>
  ({ frame }) => {
    const [x, y] = sampleTrack(LEADER_TRACK, frame, { loopOut: "cycle" });
    return [x, y + dy];
  };
const LEADERS = {
  teal: shifted(-34),
  rose: shifted(0),
  phosphor: shifted(34),
};

/**
 * A tapered ribbon through the chain: each link is pushed out along its local
 * normal by a half-width that shrinks toward the tail, and the closed outline
 * is smoothed and filled with a head-to-tail gradient.
 */
const Ribbon: React.FC<{ links: FollowLink[]; color: string; tail: string; width: number }> = ({
  links,
  color,
  tail,
  width,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pts = links.map((l) => l.position);
  const n = pts.length;
  const left: Array<{ x: number; y: number }> = [];
  const right: Array<{ x: number; y: number }> = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const tx = a[0] - b[0];
    const ty = a[1] - b[1];
    const len = Math.hypot(tx, ty) || 1;
    const half = (width / 2) * (1 - i / (n - 1)) ** 0.75 + 0.6;
    left.push({ x: p[0] + (-ty / len) * half, y: p[1] + (tx / len) * half });
    right.push({ x: p[0] - (-ty / len) * half, y: p[1] - (tx / len) * half });
  });
  const d = toD(smoothThrough([...left, ...right.reverse()], true));
  const head = pts[0];
  const end = pts[n - 1];
  return (
    <>
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1={head[0]} y1={head[1]} x2={end[0]} y2={end[1]}>
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={tail} stopOpacity={0.4} />
        </linearGradient>
        <filter id={`b${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <path d={d} fill={`url(#g${id})`} opacity={0.55} filter={`url(#b${id})`} />
      <path d={d} fill={`url(#g${id})`} />
    </>
  );
};

const Head: React.FC<{ link: FollowLink; color: string }> = ({ link, color }) =>
  link.index === 0 ? (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 26px ${color}`,
      }}
    />
  ) : null;

const Tail: React.FC<{
  leader: Animatable<Vec2>;
  color: string;
  tail: string;
  width: number;
  damping: number;
  frequency: number;
  falloff?: number;
  delay?: number;
}> = ({ leader, color, tail, width, damping, frequency, falloff = 1, delay = 0 }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <FollowThrough
      leader={leader}
      links={18}
      frequency={frequency}
      damping={damping}
      falloff={falloff}
      delay={delay}
      preroll={LOOP}
      {...SIZE}
      renderSpine={({ links }) => <Ribbon links={links} color={color} tail={tail} width={width} />}
      renderLink={(link) => <Head link={link} color={color} />}
    />
  </div>
);

export const FollowThroughPreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <Tail leader={LEADERS.teal} color={DEMO_PALETTE.teal} tail="#0f3d39" width={26} damping={1} frequency={7} delay={2} />
    <Tail leader={LEADERS.rose} color={DEMO_PALETTE.rose} tail="#3d1330" width={26} damping={0.5} frequency={5} delay={1.5} />
    <Tail
      leader={LEADERS.phosphor}
      color={DEMO_PALETTE.phosphor}
      tail="#3a2a10"
      width={26}
      damping={0.6}
      frequency={3}
      delay={0.8}
      falloff={0.95}
    />
  </PreviewFrame>
);
