import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type ParticleFieldProps = {
  /** Plate behind the field. `transparent` layers it over what is below. */
  backgroundColor?: string;
  /** Particle colour. */
  color?: string;
  /** How many particles. */
  count?: number;
  /** Direction of travel in degrees. 0 drifts straight up, 90 to the right. */
  angle?: number;
  /** Traverse speed. 1 crosses the frame in about eight seconds. */
  speed?: number;
  /** Diameter of the nearest particle, in px. */
  size?: number;
  /** Diameter of the furthest particle, in px. */
  minSize?: number;
  /** Defocus applied to the furthest particles, in px. 0 flattens the field. */
  depthBlur?: number;
  /** Sideways wander, in percent of the frame. 0 makes the drift dead straight. */
  drift?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Halo around each particle, as a multiple of its size. 0 draws hard dots. */
  glow?: number;
  /** Changes the layout without changing any other prop. */
  seed?: number;
};

function hash(index: number, salt: number, seed: number): number {
  const value = Math.sin(index * 53.17 + salt * 79.3 + seed * 27.1) * 43758.5453;
  return value - Math.floor(value);
}

/** Percent of the frame a particle covers between wraps. Both ends sit outside. */
const TRACK = 140;
/** Seconds a near particle takes to cross the track at `speed={1}`. */
const CROSSING_SECONDS = 8;

type Particle = {
  /** 0 far, 1 near. Drives size, speed, opacity and focus together. */
  depth: number;
  /** Start position along the track, 0–1. */
  offset: number;
  /** Position across the track, 0–1. */
  lane: number;
  driftAmount: number;
  driftPeriod: number;
  driftPhase: number;
  twinklePeriod: number;
  twinklePhase: number;
};

function buildParticles(count: number, seed: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    // Squared so most particles sit far back: an evenly distributed depth makes
    // a field of same-sized dots, which is the thing that reads as a texture
    // rather than as air.
    depth: hash(index, 1, seed) ** 2,
    offset: hash(index, 2, seed),
    lane: hash(index, 3, seed),
    driftAmount: 0.4 + hash(index, 4, seed) * 1.6,
    /* Wander periods beat against the linear travel so no particle repeats a
     * position it has already held inside a preview loop. */
    driftPeriod: 1.1 + hash(index, 5, seed) * 1.3,
    driftPhase: hash(index, 6, seed) * Math.PI * 2,
    twinklePeriod: 0.9 + hash(index, 7, seed) * 1.2,
    twinklePhase: hash(index, 8, seed) * Math.PI * 2,
  }));
}

/**
 * Ambient particles drifting with depth.
 *
 * Continuous, unlike `confetti-burst`, which is a single impulse with physics:
 * this has no beginning and no end, so it can sit under a whole scene.
 *
 * Depth is one number per particle and everything else follows from it — near
 * particles are larger, faster, brighter and in focus; far ones are small, slow
 * and defocused. That single correlation is what makes a flat plane of divs
 * read as volume. Travel wraps on a track that starts and ends outside the
 * frame, so nothing ever pops into existence on screen.
 */
export const ParticleField: React.FC<ParticleFieldProps> = ({
  backgroundColor = "#05070f",
  color = "#e8b86d",
  count = 70,
  angle = 8,
  speed = 1,
  size = 14,
  minSize = 2,
  depthBlur = 3,
  drift = 4,
  intensity = 1,
  glow = 1.6,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = (frame / fps) * speed;

  const particles = buildParticles(Math.max(1, Math.round(count)), seed);
  const radians = (angle * Math.PI) / 180;
  // 0deg travels up, so the direction vector is (sin, -cos) in screen space.
  const dirX = Math.sin(radians);
  const dirY = -Math.cos(radians);
  const perpX = Math.cos(radians);
  const perpY = Math.sin(radians);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {particles.map((particle, index) => {
        const rate = (0.35 + particle.depth * 0.95) / CROSSING_SECONDS;
        const along = (particle.offset + time * rate) % 1;
        const wander =
          Math.sin((time / particle.driftPeriod) * Math.PI * 2 + particle.driftPhase) *
          drift *
          particle.driftAmount;
        const across = particle.lane * TRACK - TRACK / 2 + wander;
        const forward = along * TRACK - TRACK / 2;

        const x = 50 + dirX * forward + perpX * across;
        const y = 50 + dirY * forward + perpY * across;
        const diameter = minSize + (size - minSize) * particle.depth;
        const twinkle =
          0.7 + 0.3 * Math.sin((time / particle.twinklePeriod) * Math.PI * 2 + particle.twinklePhase);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${x.toFixed(3)}%`,
              top: `${y.toFixed(3)}%`,
              width: diameter,
              height: diameter,
              marginLeft: -diameter / 2,
              marginTop: -diameter / 2,
              borderRadius: "50%",
              background:
                glow > 0
                  ? `radial-gradient(circle, ${color} 0%, ${color} 34%, transparent 70%)`
                  : color,
              transform: glow > 0 ? `scale(${1 + glow})` : undefined,
              filter: depthBlur > 0 ? `blur(${((1 - particle.depth) * depthBlur).toFixed(2)}px)` : undefined,
              opacity: (0.18 + particle.depth * 0.7) * twinkle * intensity,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
