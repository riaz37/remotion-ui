import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type LightRaysProps = {
  /** Plate behind the rays. `transparent` layers them over whatever is below. */
  backgroundColor?: string;
  /** Colour of the shafts. */
  color?: string;
  /** How many shafts. Odd counts avoid a symmetric seam down the middle. */
  rayCount?: number;
  /** Total fan angle, in degrees. */
  spread?: number;
  /** Direction the fan points, in degrees. 0 points straight down. */
  angle?: number;
  /** Where the light comes from, in percent of the frame. */
  originX?: number;
  originY?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Sway speed. 1 is a slow drift; 0 freezes the fan. */
  speed?: number;
  /** Softness of a shaft's edge, in px. */
  blur?: number;
  /** Bloom radius at the source, in percent. 0 removes the bloom. */
  bloom?: number;
};

type Ray = {
  /** Position across the fan, -0.5 to 0.5. */
  offset: number;
  width: number;
  alpha: number;
  period: number;
  phase: number;
  sway: number;
};

/**
 * Deterministic 0–1 per ray. The fan has to be identical on every frame of a
 * render, so the variation is hashed from the index, never sampled.
 */
function hash(index: number, salt: number): number {
  const value = Math.sin(index * 41.13 + salt * 289.7) * 43758.5453;
  return value - Math.floor(value);
}

function buildRays(count: number): Ray[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    return {
      offset: t - 0.5,
      // Uneven widths are what stop a fan reading as a printed sunburst.
      width: 1.6 + hash(index, 1) * 5.4,
      alpha: 0.24 + hash(index, 2) * 0.76,
      /* Sway periods are short and the arcs are wide on purpose. An 18px blur
       * swallows anything under a couple of degrees: the first cut swayed 1-2°
       * over six seconds and measured as a still frame on the audit. */
      period: 1.6 + hash(index, 3) * 2.4,
      phase: hash(index, 4) * Math.PI * 2,
      sway: 2.6 + hash(index, 5) * 5.4,
    };
  });
}

/**
 * Volumetric shafts fanning out of a point and drifting.
 *
 * A full-frame background, unlike `light-sweep-text`, which is a specular pass
 * clipped to letterforms — and shafts rather than blobs, which is
 * `mesh-gradient-bg`'s job.
 *
 * Each shaft is a tapered wedge on `screen`, so overlapping shafts add the way
 * light does instead of stacking alpha and going muddy. Width, brightness and
 * sway period are all hashed per index: an evenly spaced, evenly bright fan
 * reads as a printed sunburst rather than as light in air.
 */
export const LightRays: React.FC<LightRaysProps> = ({
  backgroundColor = "#080810",
  color = "#e8b86d",
  rayCount = 11,
  spread = 52,
  angle = 22,
  originX = 26,
  originY = -12,
  intensity = 1,
  speed = 1,
  blur = 13,
  bloom = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = (frame / fps) * speed;

  const rays = buildRays(Math.max(1, Math.round(rayCount)));
  // The whole fan breathes as one, on a longer clock than any single shaft.
  const fanDrift = Math.sin(time * 0.52) * 5.5;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {bloom > 0 ? (
        <div
          style={{
            position: "absolute",
            left: `${originX}%`,
            top: `${originY}%`,
            width: `${bloom * 2}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
            opacity: 0.3 * intensity * (0.86 + 0.14 * Math.sin(time * 0.7)),
            filter: `blur(${blur * 2}px)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      {rays.map((ray, index) => {
        const sway = Math.sin(time / ray.period + ray.phase) * ray.sway;
        const rotation = angle + fanDrift + ray.offset * spread + sway;
        // Shafts pulse out of phase with their own sway, so nothing in the fan
        // shares a beat.
        const flicker = 0.45 + 0.55 * Math.sin(time / (ray.period * 0.6) + ray.phase * 1.7);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${originX}%`,
              top: `${originY}%`,
              width: `${ray.width}%`,
              height: "190%",
              marginLeft: `${-ray.width / 2}%`,
              transformOrigin: "50% 0%",
              transform: `rotate(${rotation.toFixed(3)}deg)`,
              background: `linear-gradient(to bottom, ${color} 0%, transparent 92%)`,
              // The wedge widens with distance, which is the difference between
              // a shaft of light and a drawn line.
              clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
              filter: `blur(${blur}px)`,
              opacity: ray.alpha * flicker * 0.46 * intensity,
              mixBlendMode: "screen",
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 120%, rgba(0,0,0,0.45), transparent 62%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
