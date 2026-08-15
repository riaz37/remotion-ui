import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ReactionBurstProps = {
  /** Glyphs cycled through as reactions spawn. */
  reactions?: string[];
  /** Reactions spawned per second. */
  ratePerSecond?: number;
  /** Which edge the stream rises along. */
  align?: "left" | "right";
  /** Seconds a single reaction takes to travel its full arc. */
  lifeSeconds?: number;
  /** Horizontal sway in units, peak to peak. */
  drift?: number;
  /** Glyph size in units at full scale. */
  size?: number;
  /** Fraction of the frame height a reaction climbs. */
  rise?: number;
  /**
   * Seconds after which no new reactions spawn. The ones already in flight
   * finish their arc. Omit to keep the stream running for the whole scene.
   */
  stopAfterSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Deterministic per-reaction jitter. Remotion renders frames out of order and
 * in parallel, so anything random has to be a pure function of the index —
 * `Math.random()` would give a different arc on every frame.
 */
const noise = (index: number, salt: number) => {
  const n = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/**
 * The continuous side-channel stream: hearts and likes spawning on a steady
 * cadence, climbing, swaying, and fading out near the top of their arc. This is
 * deliberately narrower than `confetti-burst`, which is a single impulse fired
 * on one beat — here the reactions keep coming for as long as the scene runs.
 */
export const ReactionBurst: React.FC<ReactionBurstProps> = ({
  reactions = ["❤️", "👍", "🔥", "😂", "✨"],
  ratePerSecond = 6,
  align = "right",
  lifeSeconds = 2.6,
  drift = 46,
  size = 44,
  rise = 0.72,
  stopAfterSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const seconds = (frame / fps) * speed;
  const life = lifeSeconds;
  const spawnEvery = 1 / ratePerSecond;

  // Every reaction still in flight is one whose spawn time falls inside the
  // trailing `life` window — walk that window rather than keeping state.
  const newest = Math.floor(seconds / spawnEvery);
  const oldest = Math.max(0, Math.ceil((seconds - life) / spawnEvery));
  const inFlight: number[] = [];
  for (let index = oldest; index <= newest; index += 1) {
    if (stopAfterSeconds !== undefined && index * spawnEvery > stopAfterSeconds) {
      break;
    }
    inFlight.push(index);
  }

  const isRight = align === "right";
  const laneWidth = 150 * u;
  const travel = height * rise;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          bottom: Math.max(safe.paddingBottom, 60 * u),
          left: isRight ? undefined : safe.paddingLeft,
          right: isRight ? safe.paddingRight : undefined,
          width: laneWidth,
          height: travel,
        }}
      >
        {inFlight.map((index) => {
          const age = seconds - index * spawnEvery;
          const t = age / life;
          const glyph = reactions[index % reactions.length];

          // Barely decelerating. A stronger ease-out spends most of the travel
          // in the first third and leaves the whole stream bunched against the
          // top of the lane with a gap underneath it.
          const climb = Math.pow(Math.min(1, Math.max(0, t)), 0.86);
          // Sway is a full sine period over the life, phase-shifted per glyph
          // so the lane never pulses in unison.
          const sway =
            Math.sin(t * Math.PI * 2 + noise(index, 1) * Math.PI * 2) *
            drift *
            u *
            (0.55 + noise(index, 2) * 0.75);
          const lane = (noise(index, 3) - 0.5) * 38 * u;

          const pop = interpolate(t, [0, 0.14], [0.5, 1], {
            easing: EASING.pop,
            ...clamp,
          });
          const scale = pop * (0.82 + noise(index, 4) * 0.42);
          // Fades over the last third — they thin out as they climb rather
          // than vanishing at the top edge.
          const opacity = interpolate(t, [0, 0.1, 0.66, 1], [0, 1, 0.85, 0], clamp);
          const tilt = (noise(index, 5) - 0.5) * 26;

          return (
            <span
              key={index}
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                fontSize: size * u,
                lineHeight: 1,
                opacity,
                transform: `translate(-50%, ${-climb * travel}px) translateX(${
                  sway + lane
                }px) scale(${scale}) rotate(${tilt * (1 - t)}deg)`,
              }}
            >
              {glyph}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
