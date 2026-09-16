import { GrainGradient } from "@paper-design/shaders-react";
import { AbsoluteFill } from "remotion";
import { PAPER_SHADER_FILL, usePaperShader } from "@/remotion/lib/paper-shader";

/** The form the gradient takes. Each is a different field, not a preset. */
export type GrainGradientShape =
  | "wave"
  | "dots"
  | "truchet"
  | "corners"
  | "ripple"
  | "blob"
  | "sphere";

export type GrainGradientBgProps = {
  /** Stage the shape sits on. */
  backgroundColor?: string;
  /** Up to 7 colors, blended across the shape. */
  colors?: string[];
  shape?: GrainGradientShape;
  /** Edge hardness between colors, 0 = posterised, 1 = smooth. */
  softness?: number;
  /** Distortion between the color bands, 0–1. */
  intensity?: number;
  /** Grain overlay, 0–1. Measured in real pixels, so it ignores `scale`. */
  noise?: number;
  /** Overall zoom, 0.01–4. */
  scale?: number;
  /** Multiplies how far the field travels per second. */
  speed?: number;
};

const DEFAULT_COLORS = ["#e4ac59", "#e07a5f", "#f0c98a"];

/**
 * A multi-color gradient with grain worked through it. The grain is the point:
 * a shallow gradient across a wide frame has only ~48 usable 8-bit levels and
 * plateaus into visible bands, and dithering it with noise is what breaks those
 * bands up. Set `noise` to 0 and the banding comes back.
 *
 * Renders with `--gl=angle`.
 */
export const GrainGradientBg: React.FC<GrainGradientBgProps> = ({
  backgroundColor = "#050505",
  colors = DEFAULT_COLORS,
  shape = "wave",
  softness = 0.6,
  intensity = 0.45,
  noise = 0.35,
  scale = 1,
  speed = 1,
}) => {
  const { containerRef, time } = usePaperShader(speed);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* Addressed through the container — Paper marks its own mount element
        * with `data-paper-shader`, so no ref has to cross the library boundary. */}
      <div ref={containerRef} style={PAPER_SHADER_FILL}>
        <GrainGradient
          speed={0}
          frame={time}
          colorBack={backgroundColor}
          colors={colors}
          shape={shape}
          softness={softness}
          intensity={intensity}
          noise={noise}
          scale={scale}
          style={PAPER_SHADER_FILL}
        />
      </div>
    </AbsoluteFill>
  );
};
