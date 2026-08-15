import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type CausticsBgProps = {
  /** Water behind the light. `transparent` layers the caustics over what is below. */
  backgroundColor?: string;
  /** Colour of the light itself. */
  color?: string;
  /** Cell size, in px at the composition's own scale. */
  scale?: number;
  /** Swim speed. 0 freezes the surface. */
  speed?: number;
  /** How hard the cells threshold. Under ~1.6 the web dissolves into plaid. */
  contrast?: number;
  /** Softness of a cell edge, in px. */
  blur?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Depth shading from the top of the frame down. 0 lights it evenly. */
  falloff?: number;
};

/**
 * Five interference layers at incommensurate angles.
 *
 * Two crossed wave trains give a plaid; three give a hexagonal lattice. The
 * traverse times are
 * deliberately unrelated — one full wavelength per 2.4s, 1.1s and 1.7s — so the
 * summed pattern never returns to an arrangement it has already held. Two
 * layers on the same clock would swim in lockstep and the cells would only
 * slide, not morph.
 *
 * There are five of them, at angles that share no common divisor. Three trains
 * make a lattice however you detune the wavelengths — the pattern is still
 * periodic in two directions, and the eye finds the tiling immediately. Five
 * incommensurate directions make the sum *quasi*-periodic: it never repeats,
 * which is what reads as water rather than as wallpaper. Two intermediate cuts
 * of this component were rejected on exactly that — a blurred checkerboard,
 * then a clean hexagonal grid.
 */
const LAYERS = [
  { angle: 0, traverse: 2.4, wobble: 3.1, wobbleAmount: 4, wavelength: 1 },
  { angle: 37, traverse: 1.1, wobble: 4.3, wobbleAmount: 3, wavelength: 0.79 },
  { angle: 71, traverse: 1.7, wobble: 3.7, wobbleAmount: 5, wavelength: 1.31 },
  { angle: 113, traverse: 2.9, wobble: 5.1, wobbleAmount: 4, wavelength: 0.67 },
  { angle: 149, traverse: 1.4, wobble: 4.7, wobbleAmount: 6, wavelength: 1.13 },
] as const;

/**
 * Underwater light caustics.
 *
 * No shader and no per-frame noise: the pattern is the sum of five tilted wave
 * trains, composited with `plus-lighter` so they add the way light does, dimmed
 * in patches by a slow swell, then pushed through a `contrast()` that turns the
 * sum into the sharp-edged web. Each train slides and rocks on its own clock,
 * so the cells stretch and pinch rather than sliding as a rigid pattern.
 *
 * A stage layer, so it has no entrance. Put it under footage with
 * `backgroundColor="transparent"`.
 */
export const CausticsBg: React.FC<CausticsBgProps> = ({
  backgroundColor = "linear-gradient(180deg, #0a3247 0%, #04121d 100%)",
  color = "#9fe8ff",
  scale = 120,
  speed = 1,
  contrast = 3.4,
  blur = 8,
  intensity = 1,
  falloff = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = (frame / fps) * speed;

  const base = Math.max(8, scale);
  /* A narrow bright band rather than a full triangular ramp. Three wide ramps
   * sum to bright almost everywhere and the threshold then carves *dark* cells
   * out of a light field — the inverse of a caustic. Narrow bands only reach
   * the threshold where several trains agree, which is the thin web. */
  const stripe = (wavelength: number) =>
    `repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${(wavelength * 0.4).toFixed(2)}px, ${color} ${(wavelength * 0.5).toFixed(2)}px, rgba(0,0,0,0) ${(wavelength * 0.6).toFixed(2)}px, rgba(0,0,0,0) ${wavelength.toFixed(2)}px)`;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          // `isolate` keeps the plus-lighter sum inside this stack; without it
          // the layers blend against the water plate and never saturate.
          isolation: "isolate",
          /* Order matters: blur first to smooth the ramps into something like
           * sines, then threshold. Thresholding first and blurring after gives
           * soft-edged blobs instead of a sharp web. */
          filter: `blur(${blur}px) contrast(${contrast}) brightness(${(0.98 * intensity).toFixed(2)})`,
          mixBlendMode: "screen",
        }}
      >
        {LAYERS.map((layer, index) => {
          const wavelength = base * layer.wavelength;
          const offset = (time / layer.traverse) * wavelength;
          const rock = Math.sin((time / layer.wobble) * Math.PI * 2 + index) * layer.wobbleAmount;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "260%",
                height: "260%",
                transform: `translate(-50%, -50%) rotate(${(layer.angle + rock).toFixed(3)}deg)`,
                backgroundImage: stripe(wavelength),
                backgroundPosition: `0px ${offset.toFixed(2)}px`,
                mixBlendMode: index === 0 ? "normal" : ("plus-lighter" as CSSProperties["mixBlendMode"]),
                opacity: 0.62,
              }}
            />
          );
        })}

        {/* Swell. Multiplying the sum by a slow, large-scale field before the
         * threshold means the web only reaches full brightness in patches, and
         * those patches drift. An evenly bright web covers the frame like a net
         * and gives the whole thing away as a pattern. */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 70% at ${(38 + Math.sin(time / 3.3) * 22).toFixed(1)}% ${(42 + Math.cos(time / 4.1) * 26).toFixed(1)}%, #d6d6d6 0%, rgba(120,120,120,0.55) 55%, rgba(60,60,60,0.35) 100%), radial-gradient(55% 60% at ${(74 + Math.cos(time / 2.7) * 18).toFixed(1)}% ${(70 + Math.sin(time / 3.9) * 20).toFixed(1)}%, #c8c8c8 0%, rgba(90,90,90,0.4) 62%, rgba(40,40,40,0.25) 100%)`,
            mixBlendMode: "multiply",
          }}
        />
      </AbsoluteFill>

      {falloff > 0 ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${falloff.toFixed(2)}) 100%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 40%, transparent 35%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
