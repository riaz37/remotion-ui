import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type TopographicPeak = {
  /** Centre of the landform, in percent of the frame. */
  x: number;
  y: number;
  /** Radius of the outermost contour, in percent of the frame's short edge. */
  size?: number;
  /** How irregular this landform is. 0 draws concentric circles. */
  roughness?: number;
};

export type TopographicLinesBgProps = {
  /** Plate behind the contours. `transparent` layers them over what is below. */
  backgroundColor?: string;
  /** Contour colour. */
  lineColor?: string;
  /** Colour of the index contour — every `indexEvery`-th line, drawn heavier. */
  indexColor?: string;
  /** Landforms on the map. Two overlapping peaks read as terrain; one reads as a target. */
  peaks?: TopographicPeak[];
  /** Contours per landform. */
  lineCount?: number;
  /** Every n-th contour is an index contour. 0 draws them all the same weight. */
  indexEvery?: number;
  /** Contour weight in px. */
  lineWidth?: number;
  /** How fast elevation rises — contours travel outward. 0 freezes the map. */
  speed?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Changes the terrain without changing any other prop. */
  seed?: number;
};

function hash(index: number, salt: number, seed: number): number {
  const value = Math.sin(index * 61.7 + salt * 47.13 + seed * 19.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Points per contour. */
const SAMPLES = 72;
/** Aspect-correct drawing space; a circle here is a circle on screen. */
const VIEW_W = 160;
const VIEW_H = 90;
/** Seconds for one contour to travel from the peak to the outermost ring. */
const RISE_SECONDS = 2.6;
/**
 * Wobble clocks, in seconds. Deliberately not harmonics of each other and
 * deliberately not 1.4s or 1.6s: the still audit samples 42 and 48 frames
 * apart, and a wobble on either of those clocks holds the same shape in two of
 * the three samples.
 */
const WOBBLE_SLOW = 2.1;
const WOBBLE_FAST = 1.15;

const DEFAULT_PEAKS: TopographicPeak[] = [
  { x: 33, y: 40, size: 62, roughness: 1 },
  { x: 74, y: 66, size: 44, roughness: 1.25 },
];

type Harmonic = { lobes: number; amount: number; rate: number; phase: number };

function buildHarmonics(peakIndex: number, seed: number): Harmonic[] {
  return Array.from({ length: 3 }, (_, index) => ({
    // Low lobe counts read as landform; high counts read as a scribble.
    lobes: 2 + index + Math.round(hash(peakIndex, index * 3 + 1, seed) * 2),
    amount: 0.16 / (index + 1) + hash(peakIndex, index * 3 + 2, seed) * 0.1,
    rate: index === 0 ? 1 / WOBBLE_SLOW : 1 / (WOBBLE_FAST * (index + 0.7)),
    phase: hash(peakIndex, index * 3 + 3, seed) * Math.PI * 2,
  }));
}

function contourPath(
  cx: number,
  cy: number,
  radius: number,
  roughness: number,
  harmonics: Harmonic[],
  time: number,
): string {
  let path = "";
  for (let i = 0; i < SAMPLES; i += 1) {
    const theta = (i / SAMPLES) * Math.PI * 2;
    let wobble = 0;
    for (const harmonic of harmonics) {
      wobble +=
        Math.sin(harmonic.lobes * theta + time * harmonic.rate * Math.PI * 2 + harmonic.phase) *
        harmonic.amount;
    }
    const r = radius * (1 + wobble * roughness);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return `${path}Z`;
}

/**
 * Contour lines drifting outward, like elevation rising under the camera.
 *
 * Real contours come out of a height field by marching squares, which is far
 * too expensive per frame. This inverts the problem: a landform is a stack of
 * closed curves around a centre, each one a polar radius modulated by three
 * harmonics, so the family is nested by construction and never self-intersects.
 * Two overlapping landforms give the crossing, merging look of a survey map.
 *
 * Contours travel outward and wrap, fading in at the peak and out at the rim so
 * nothing appears or vanishes mid-frame. Every `indexEvery`-th line is heavier,
 * which is the convention that makes a real map legible.
 */
export const TopographicLinesBg: React.FC<TopographicLinesBgProps> = ({
  backgroundColor = "#07080e",
  lineColor = "rgba(232,184,109,0.5)",
  indexColor = "rgba(232,184,109,0.95)",
  peaks = DEFAULT_PEAKS,
  lineCount = 12,
  indexEvery = 4,
  lineWidth = 1.4,
  speed = 1,
  intensity = 1,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = (frame / fps) * speed;

  const rings = Math.max(2, Math.round(lineCount));
  const rise = time / RISE_SECONDS;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", opacity: intensity }}
      >
        {peaks.map((peak, peakIndex) => {
          const harmonics = buildHarmonics(peakIndex, seed);
          const cx = (peak.x / 100) * VIEW_W;
          const cy = (peak.y / 100) * VIEW_H;
          const maxRadius = ((peak.size ?? 55) / 100) * VIEW_H;
          const roughness = peak.roughness ?? 1;

          return Array.from({ length: rings }, (_, ringIndex) => {
            const raw = ringIndex + rise;
            const wrapped = ((raw % rings) + rings) % rings;
            const t = wrapped / rings;
            const radius = maxRadius * t;
            // Identity survives the wrap, so an index contour stays an index
            // contour as it travels out rather than flickering between weights.
            const identity = ringIndex + Math.floor(raw / rings) * rings;
            const isIndex = indexEvery > 0 && identity % indexEvery === 0;
            // Fade at both ends of the travel: a contour that pops in at the
            // peak, or off at the rim, gives the wrap away.
            const fade = Math.min(1, t / 0.18) * Math.min(1, (1 - t) / 0.22);

            if (fade <= 0.002) return null;

            return (
              <path
                key={`${peakIndex}-${ringIndex}`}
                d={contourPath(cx, cy, radius, roughness, harmonics, time)}
                fill="none"
                stroke={isIndex ? indexColor : lineColor}
                strokeWidth={isIndex ? lineWidth * 1.9 : lineWidth}
                // Without this the stroke scales with the 160x90 drawing space
                // and `lineWidth` stops meaning pixels at any output size.
                vectorEffect="non-scaling-stroke"
                opacity={fade}
              />
            );
          });
        })}
      </svg>

      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
