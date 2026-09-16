import { Dithering } from "@paper-design/shaders-react";
import { AbsoluteFill } from "remotion";
import { PAPER_SHADER_FILL, usePaperShader } from "@/remotion/lib/paper-shader";

/** Pattern the dither is sampled from, before the grid quantises it. */
export type DitherFieldShape =
  | "simplex"
  | "warp"
  | "dots"
  | "wave"
  | "ripple"
  | "swirl"
  | "sphere";

/** Threshold matrix. The Bayer sizes are ordered; `random` is white noise. */
export type DitherFieldPattern = "random" | "2x2" | "4x4" | "8x8";

export type DitherFieldBgProps = {
  /** Paper: the unlit half of the two-tone field. */
  backgroundColor?: string;
  /** Ink: the lit half. The field only ever holds these two colors. */
  inkColor?: string;
  shape?: DitherFieldShape;
  pattern?: DitherFieldPattern;
  /** Size of one dither cell in pixels, 0.5–20. Larger reads more retro. */
  pixelSize?: number;
  /** Zoom on the underlying pattern, 0.01–4. */
  scale?: number;
  /** Multiplies how far the field travels per second. */
  speed?: number;
};

/**
 * A two-color ordered-dither field: a smooth pattern quantised to a pixel grid,
 * so it reads as print halftone or an early bitmap display rather than a
 * gradient. The dither grid is measured in real pixels and is deliberately not
 * affected by `scale` — zooming moves the pattern underneath a fixed grid.
 *
 * Renders with `--gl=angle`.
 */
export const DitherFieldBg: React.FC<DitherFieldBgProps> = ({
  backgroundColor = "#05070c",
  inkColor = "#7aa2ff",
  // `simplex`, `warp`, `dots` and `wave` are pattern shapes: they tile and fill
  // the frame at any size. `ripple`, `swirl` and `sphere` are object shapes with
  // a bounded edge, so at a scale below 1 they sit as a shape in an empty field
  // rather than covering it — fine when that is what you want, wrong as the
  // default for a background.
  shape = "warp",
  pattern = "4x4",
  pixelSize = 2,
  scale = 1,
  speed = 1,
}) => {
  const { containerRef, time } = usePaperShader(speed);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* The shader is addressed through this container rather than a ref on the
        * component itself: Paper marks its own mount element with
        * `data-paper-shader`, which is stable and costs no ref plumbing. */}
      <div ref={containerRef} style={PAPER_SHADER_FILL}>
        <Dithering
          speed={0}
          frame={time}
          colorBack={backgroundColor}
          colorFront={inkColor}
          shape={shape}
          type={pattern}
          size={pixelSize}
          scale={scale}
          style={PAPER_SHADER_FILL}
        />
      </div>
    </AbsoluteFill>
  );
};
