import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

export type ConfettiBurstProps = {
  count?: number;
  originX?: number;
  originY?: number;
  spread?: number;
  seed?: string;
  colors?: string[];
  durationInFrames?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#f59e0b", "#fafafa"];

type Particle = {
  angle: number;
  speed: number;
  spin: number;
  size: number;
  color: string;
  wobble: number;
};

function createParticles(
  count: number,
  spread: number,
  colors: string[],
  seed: string,
): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle =
      -Math.PI / 2 +
      (random(`${seed}-angle-${index}`) - 0.5) * spread;
    const speed = 220 + random(`${seed}-speed-${index}`) * 380;

    return {
      angle,
      speed,
      spin: (random(`${seed}-spin-${index}`) - 0.5) * 720,
      size: 6 + random(`${seed}-size-${index}`) * 10,
      color: colors[index % colors.length],
      wobble: random(`${seed}-wobble-${index}`) * 40,
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
  durationInFrames = DURATION.slow,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const particles = createParticles(count, spread, colors, seed);
  const gravity = 680;
  const time = frame / fps;
  const fade = interpolate(
    frame,
    [durationInFrames * 0.55, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );

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
        const x =
          originPxX +
          vx * time +
          Math.sin(frame / 6 + particle.wobble) * particle.wobble * 0.15;
        const y = originPxY + vy * time + 0.5 * gravity * time * time;
        const rotation = particle.spin * time;
        const opacity =
          y > height + 40 ? 0 : fade * (0.55 + (index % 3) * 0.12);

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={particle.size}
            height={particle.size * 0.55}
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
