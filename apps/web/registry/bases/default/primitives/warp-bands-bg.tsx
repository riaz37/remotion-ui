import { Warp } from "@paper-design/shaders-react";
import { AbsoluteFill } from "remotion";
import { PAPER_SHADER_FILL, usePaperShader } from "@/remotion/lib/paper-shader";

/** Base pattern the color bands are laid over before they are distorted. */
export type WarpBandsPattern = "checks" | "stripes" | "edge";

export type WarpBandsBgProps = {
  /** Up to 10 colors, blended in order. Include a dark one to keep bands apart. */
  colors?: string[];
  pattern?: WarpBandsPattern;
  /** Where one color gives way to the next, 0–1. 0.5 is an even split. */
  proportion?: number;
  /** Edge hardness between colors, 0 = hard band, 1 = full gradient. */
  softness?: number;
  /** Noise distortion across the bands, 0–1. */
  distortion?: number;
  /** Swirl strength, 0–1. This is what makes the bands read as marble. */
  swirl?: number;
  /** Layered swirl passes, 0–20. More passes, more folding. */
  swirlIterations?: number;
  /** Zoom on the base pattern, 0–1. */
  patternScale?: number;
  /** Overall zoom, 0.01–4. */
  scale?: number;
  /** Rotation of the whole field in degrees. */
  rotation?: number;
  /** Multiplies how far the field travels per second. */
  speed?: number;
};

const DEFAULT_COLORS = ["#0b0a08", "#e4ac59", "#0b0a08", "#c2557a"];

/**
 * Color bands folded through noise and a swirl — smoke, ink in water, marble,
 * depending on how hard the edges are. Softness is the prop that changes its
 * character most: at `0` the bands stay as legible ribbons, at `1` they melt
 * into a single field.
 *
 * Renders with `--gl=angle`.
 */
export const WarpBandsBg: React.FC<WarpBandsBgProps> = ({
  colors = DEFAULT_COLORS,
  pattern = "checks",
  proportion = 0.45,
  softness = 1,
  distortion = 0.25,
  swirl = 0.8,
  swirlIterations = 10,
  patternScale = 0.1,
  scale = 1,
  rotation = 0,
  speed = 1,
}) => {
  const { containerRef, time } = usePaperShader(speed);

  return (
    <AbsoluteFill style={{ backgroundColor: colors[0], overflow: "hidden" }}>
      {/* Addressed through the container — Paper marks its own mount element
        * with `data-paper-shader`, so no ref has to cross the library boundary. */}
      <div ref={containerRef} style={PAPER_SHADER_FILL}>
        <Warp
          speed={0}
          frame={time}
          colors={colors}
          shape={pattern}
          proportion={proportion}
          softness={softness}
          distortion={distortion}
          swirl={swirl}
          swirlIterations={swirlIterations}
          shapeScale={patternScale}
          scale={scale}
          rotation={rotation}
          style={PAPER_SHADER_FILL}
        />
      </div>
    </AbsoluteFill>
  );
};
