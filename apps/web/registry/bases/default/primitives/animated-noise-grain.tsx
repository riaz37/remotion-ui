import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type AnimatedNoiseGrainProps = {
  /** Content the grain sits over. Omit to use it as a bare overlay layer. */
  children?: ReactNode;
  /** Grain strength, 0–1. Film sits around 0.12–0.25; above 0.4 reads as damage. */
  opacity?: number;
  /** Tile size on screen, in px. Larger grain reads coarser and cheaper. */
  size?: number;
  /** Noise frequency inside the tile. Higher is finer. */
  density?: number;
  /** Octaves of the noise. 1 is smooth, 4 is gritty. */
  detail?: number;
  /** Frames each grain pattern is held. 2 gives the 15fps chatter of real film. */
  holdInFrames?: number;
  /** How the grain composites. `overlay` keeps midtones, `screen` lifts blacks. */
  blendMode?: CSSProperties["mixBlendMode"];
  /** Keep the noise coloured instead of desaturating it to silver. */
  colored?: boolean;
  /** Extra grain in the corners, 0–1 — real film is heaviest away from centre. */
  vignette?: number;
  /** Changes the pattern without changing any other prop. */
  seed?: number;
};

/**
 * One tile, generated once.
 *
 * `feTurbulence` inside a data URI is rasterised by the browser when the URL is
 * first decoded and then cached like any other image. Because the URL depends
 * only on props — never on `frame` — a 300-frame render decodes it once. Every
 * per-frame noise implementation this replaced (canvas `putImageData`, a live
 * `<filter>` on the frame, a fresh `seed` each frame) pays that rasterisation
 * 300 times instead.
 */
function grainTile(density: number, detail: number, colored: boolean, seed: number): string {
  const desaturate = colored ? "" : `<feColorMatrix type="saturate" values="0"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${density}" numOctaves="${detail}" seed="${seed}" stitchTiles="stitch"/>${desaturate}</filter><rect width="220" height="220" filter="url(#g)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Deterministic 0–1 per grain step. */
function hash(step: number, salt: number): number {
  const value = Math.sin(step * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Film grain that boils, without generating noise per frame.
 *
 * The noise itself is one stitched turbulence tile baked into a data URI. What
 * changes every step is where that tile is sampled from and which way it is
 * flipped: a hashed sub-tile offset plus one of four mirrorings. Because the
 * tile stitches, the offset wraps invisibly, and because the flip breaks the
 * translation the eye reads new grain rather than a sliding texture.
 *
 * `holdInFrames` is the film-stock control. Grain that changes on every frame of
 * a 30fps render looks like video noise; holding each pattern for two frames
 * gives the coarser chatter of film shot at 15fps.
 */
export const AnimatedNoiseGrain: React.FC<AnimatedNoiseGrainProps> = ({
  children,
  opacity = 0.18,
  size = 220,
  density = 0.85,
  detail = 3,
  holdInFrames = 2,
  blendMode = "overlay",
  colored = false,
  vignette = 0.35,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / Math.max(1, Math.round(holdInFrames)));

  const tile = grainTile(density, Math.max(1, Math.round(detail)), colored, seed);
  const offsetX = hash(step, 1) * size;
  const offsetY = hash(step, 2) * size;
  // Four mirrorings, so consecutive steps are not a translation of each other.
  const flip = Math.floor(hash(step, 3) * 4);
  const flipX = flip % 2 === 0 ? 1 : -1;
  const flipY = flip < 2 ? 1 : -1;

  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill
        style={{
          backgroundImage: tile,
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px`,
          transform: `scale(${flipX}, ${flipY})`,
          mixBlendMode: blendMode,
          opacity,
          pointerEvents: "none",
        }}
      />
      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage: tile,
            backgroundSize: `${size}px ${size}px`,
            backgroundPosition: `${(offsetY * 0.7).toFixed(1)}px ${(offsetX * 0.7).toFixed(1)}px`,
            transform: `scale(${-flipX}, ${flipY})`,
            // The second pass is masked to the edges, which is where film grain
            // actually lives — an even field of grain reads as a digital filter.
            maskImage: "radial-gradient(circle at 50% 50%, transparent 35%, black 100%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 35%, black 100%)",
            mixBlendMode: blendMode,
            opacity: opacity * vignette,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
