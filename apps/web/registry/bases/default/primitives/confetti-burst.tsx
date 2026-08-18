import { useMemo } from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

export type ConfettiBurstProps = {
  count?: number;
  originX?: number;
  originY?: number;
  spread?: number;
  seed?: string;
  colors?: string[];
  /**
   * Downward acceleration in px/s². The default throws the burst off the bottom
   * of a 1080p frame in about two seconds, which is right for a punctuation
   * beat; lower it when the confetti has to stay in shot for longer.
   */
  gravity?: number;
  /** Air resistance on the outward throw, per second. Higher settles sooner. */
  drag?: number;
  durationInFrames?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#f59e0b", "#fafafa"];

/** px/s². Tuned so a 1080p frame empties in roughly two seconds. */
const DEFAULT_GRAVITY = 680;
/** Outward-velocity decay, per second. */
const DEFAULT_DRAG = 1.6;
/** Wobble oscillations per second — expressed in seconds, never in frames. */
const WOBBLE_RATE = 5;

type Particle = {
  angle: number;
  speed: number;
  spin: number;
  size: number;
  color: string;
  wobble: number;
  shape: "rect" | "circle";
  popDelay: number;
};

function createParticles(count: number, spread: number, colors: string[], seed: string): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (random(`${seed}-angle-${index}`) - 0.5) * spread;
    const speed = 220 + random(`${seed}-speed-${index}`) * 380;

    return {
      angle,
      speed,
      spin: (random(`${seed}-spin-${index}`) - 0.5) * 720,
      size: 6 + random(`${seed}-size-${index}`) * 10,
      color: colors[index % colors.length],
      wobble: random(`${seed}-wobble-${index}`) * 40,
      shape: random(`${seed}-shape-${index}`) > 0.5 ? "circle" : "rect",
      popDelay: random(`${seed}-pop-${index}`) * 3,
    };
  });
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  count = 48,
  originX = 50,
  originY = 42,
  spread = Math.PI * 0.9,
  seed = "confetti",
  colors = DEFAULT_COLORS,
  gravity = DEFAULT_GRAVITY,
  drag = DEFAULT_DRAG,
  durationInFrames = DURATION.slow,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  /* The particle table is a pure function of these four props, so it must not
   * be rebuilt per frame — 48 particles is 7 `random()` calls each. Keyed on
   * the joined palette rather than on `colors`: a caller passing an array
   * literal hands this a new reference every frame, and the memo would never
   * hit. */
  const paletteKey = colors.join(",");
  const particles = useMemo(
    () => createParticles(count, spread, colors, seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, spread, paletteKey, seed],
  );
  const time = frame / fps;
  const fade = interpolate(frame, [durationInFrames * 0.55, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.exit,
  });

  const originPxX = (originX / 100) * width;
  const originPxY = (originY / 100) * height;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle, index) => {
        const vx = Math.cos(particle.angle) * particle.speed;
        const vy = Math.sin(particle.angle) * particle.speed;
        // Air drag decays outward velocity over time; gravity still integrates linearly.
        const settle = (1 - Math.exp(-drag * time)) / drag;
        const x =
          originPxX +
          vx * settle +
          Math.sin(time * WOBBLE_RATE + particle.wobble) * particle.wobble * 0.15;
        const y = originPxY + vy * settle + 0.5 * gravity * time * time;
        const rotation = particle.spin * time;

        const pop = interpolate(frame, [particle.popDelay, particle.popDelay + 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.pop,
        });
        const opacity = y > height + 40 ? 0 : fade * pop * (0.55 + (index % 3) * 0.12);
        const size = particle.size * pop;

        if (particle.shape === "circle") {
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={size * 0.5}
              fill={particle.color}
              opacity={opacity}
            />
          );
        }

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={size}
            height={size * 0.55}
            fill={particle.color}
            opacity={opacity}
            transform={`rotate(${rotation} ${x} ${y})`}
            rx={1}
          />
        );
      })}
    </svg>
  );
};
