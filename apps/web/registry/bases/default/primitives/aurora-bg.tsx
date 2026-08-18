import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type AuroraBgProps = {
  /** Plate behind the ribbons. `transparent` layers them over what is below. */
  backgroundColor?: string;
  /** Ribbon colours, cycled. Two or three related hues read best. */
  colors?: string[];
  /** How many curtains. */
  ribbonCount?: number;
  /** Vertical travel of a curtain's fold, in percent of the frame height. */
  amplitude?: number;
  /** Curtain height at its thickest point, in percent of the frame height. */
  thickness?: number;
  /** Where the band sits, in percent of the frame height. */
  centerY?: number;
  /** How far the band spreads around `centerY`, in percent. */
  spread?: number;
  /** Drift speed. 1 is a slow aurora; 0 freezes the sky. */
  speed?: number;
  /**
   * Softness in px. This is the prop that decides whether the layer reads as
   * curtains or as blobs — much above 20 and the fold structure is gone.
   */
  blur?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Ground glow under the band. 0 removes it. */
  horizonGlow?: number;
  /** Vertical ray structure through the curtains, 0–1. 0 leaves them smooth. */
  striation?: number;
  /** Changes the fold layout without changing any other prop. */
  seed?: number;
};

/** Deterministic 0–1. The sky must be identical on every render of a frame. */
function hash(index: number, salt: number, seed: number): number {
  const value = Math.sin(index * 37.31 + salt * 91.7 + seed * 13.9) * 43758.5453;
  return value - Math.floor(value);
}

/** Points per edge. 30 is smooth at 1080p; the cost is one path string. */
const SAMPLES = 30;
/** Curtains are drawn past both edges so a fold never ends inside the frame. */
const OVERSCAN = 12;

/**
 * Two incommensurate periods per fold, in seconds.
 *
 * A single travelling wave repeats exactly once per period, and the still audit
 * samples 42 and 48 frames apart — a fold on one 1.4s clock would sit in the
 * same shape in two of three samples. Beating a 2.3s clock against a 1.1s one
 * means the curtain never returns to a shape it has already held.
 */
const SLOW_PERIOD = 2.3;
const FAST_PERIOD = 1.1;

/** One 72px-wide ray cell, tiled by `maskSize`. Alpha is what the mask reads. */
function rayMask(strength: number): string {
  const dip = Math.max(0, 1 - strength).toFixed(3);
  return `linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,${dip}) 38%, rgba(0,0,0,0.82) 64%, rgba(0,0,0,1) 100%)`;
}

type Ribbon = {
  color: string;
  /** Vertical offset from `centerY`, -0.5 to 0.5 of `spread`. */
  band: number;
  slowRate: number;
  fastRate: number;
  slowPhase: number;
  fastPhase: number;
  /** Folds across the frame. Non-integer counts stop curtains rhyming. */
  waves: number;
  drift: number;
  scale: number;
  alpha: number;
};

function buildRibbons(count: number, colors: string[], seed: number): Ribbon[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    return {
      color: colors[index % colors.length],
      band: t - 0.5,
      slowRate: 0.8 + hash(index, 1, seed) * 0.5,
      fastRate: 0.75 + hash(index, 2, seed) * 0.6,
      slowPhase: hash(index, 3, seed) * Math.PI * 2,
      fastPhase: hash(index, 4, seed) * Math.PI * 2,
      waves: 1.3 + hash(index, 5, seed) * 1.4,
      drift: (hash(index, 6, seed) - 0.5) * 26,
      scale: 0.65 + hash(index, 7, seed) * 0.6,
      alpha: 0.5 + hash(index, 8, seed) * 0.5,
    };
  });
}

/**
 * Builds one curtain as a closed path in a 0–100 viewBox.
 *
 * The thickness tapers to nothing at both ends, which is the whole difference
 * between a ribbon and a band: a constant-height shape reads as a painted
 * stripe no matter how it undulates.
 */
function ribbonPath(
  ribbon: Ribbon,
  time: number,
  amplitude: number,
  thickness: number,
  centerY: number,
  spread: number,
): string {
  const k = (ribbon.waves * Math.PI * 2) / (100 + OVERSCAN * 2);
  const slow = (time / SLOW_PERIOD) * ribbon.slowRate * Math.PI * 2;
  const fast = (time / FAST_PERIOD) * ribbon.fastRate * Math.PI * 2;
  const base = centerY + ribbon.band * spread + Math.sin(slow * 0.5 + ribbon.slowPhase) * amplitude * 0.35;

  const top: number[] = [];
  const bottom: number[] = [];

  for (let i = 0; i <= SAMPLES; i += 1) {
    const u = i / SAMPLES;
    const x = -OVERSCAN + u * (100 + OVERSCAN * 2);
    const fold =
      Math.sin(k * (x + ribbon.drift * time) + slow + ribbon.slowPhase) * amplitude +
      Math.sin(k * 2.3 * x + fast + ribbon.fastPhase) * amplitude * 0.32;
    // sin(pi*u) is 0 at both ends and 1 in the middle: the taper.
    const taper = Math.sin(Math.PI * u) ** 1.4;
    const height = thickness * ribbon.scale * (0.3 + 0.7 * taper);
    top.push(base + fold - height);
    bottom.push(base + fold + height * 0.25);
  }

  const forward = top
    .map((y, i) => {
      const x = -OVERSCAN + (i / SAMPLES) * (100 + OVERSCAN * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const back = bottom
    .map((_, i) => {
      const index = SAMPLES - i;
      const x = -OVERSCAN + (index / SAMPLES) * (100 + OVERSCAN * 2);
      return `L${x.toFixed(2)},${bottom[index].toFixed(2)}`;
    })
    .join(" ");

  return `${forward} ${back} Z`;
}

/**
 * Drifting aurora curtains.
 *
 * Ribbons, not blobs — `mesh-gradient-bg` owns blobs, and the difference is
 * structural rather than stylistic: a blob is a radial gradient that moves, a
 * ribbon is a tapered path whose *shape* changes every frame. Each curtain is
 * filled with a vertical gradient that is brightest along its lower edge, which
 * is how a real aurora reads, and composited on `screen` so overlapping
 * curtains add light instead of stacking alpha.
 *
 * There is no entrance. This is a stage layer; the content on top of it owns
 * the entrance.
 */
export const AuroraBg: React.FC<AuroraBgProps> = ({
  backgroundColor = "#05070f",
  colors = ["#4cd6a6", "#4f9cf9", "#a273ff"],
  ribbonCount = 4,
  amplitude = 9,
  thickness = 15,
  centerY = 46,
  spread = 34,
  speed = 1,
  blur = 14,
  intensity = 1.3,
  horizonGlow = 0.5,
  striation = 0.55,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Gradient ids are document-global. `seed` only varies the curtain shapes, so
  // two AuroraBgs sharing a seed would also share ids and paint each other's
  // gradient. useId is per-instance and stable across frames.
  const uid = useId().replace(/:/g, "");
  const time = (frame / fps) * speed;

  const palette = colors.length > 0 ? colors : ["#4cd6a6"];
  const ribbons = buildRibbons(Math.max(1, Math.round(ribbonCount)), palette, seed);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {horizonGlow > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 60% at 50% ${centerY + spread * 0.5}%, ${palette[0]} 0%, transparent 70%)`,
            opacity: 0.16 * horizonGlow * intensity * (0.85 + 0.15 * Math.sin((time / SLOW_PERIOD) * Math.PI)),
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          filter: `blur(${blur}px)`,
          /* Rays, drifting with the curtains. A curtain with no vertical
           * structure is a smear of colour — this is the single cheapest thing
           * that separates an aurora from a gradient blob, and it costs one
           * mask. Masking happens after the filter, so the rays stay crisp
           * while the folds stay soft. */
          ...(striation > 0
            ? {
                maskImage: rayMask(striation),
                WebkitMaskImage: rayMask(striation),
                maskSize: "72px 100%",
                WebkitMaskSize: "72px 100%",
                maskPosition: `${((time * 9) % 72).toFixed(2)}px 0`,
                WebkitMaskPosition: `${((time * 9) % 72).toFixed(2)}px 0`,
              }
            : {}),
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            {ribbons.map((ribbon, index) => (
              <linearGradient key={index} id={`aurora-${uid}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ribbon.color} stopOpacity="0" />
                <stop offset="55%" stopColor={ribbon.color} stopOpacity="0.55" />
                <stop offset="100%" stopColor={ribbon.color} stopOpacity="1" />
              </linearGradient>
            ))}
          </defs>
          {ribbons.map((ribbon, index) => (
            <path
              key={index}
              d={ribbonPath(ribbon, time, amplitude, thickness, centerY, spread)}
              fill={`url(#aurora-${uid}-${index})`}
              opacity={ribbon.alpha * 0.72 * intensity}
              style={{ mixBlendMode: "screen" }}
            />
          ))}
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
