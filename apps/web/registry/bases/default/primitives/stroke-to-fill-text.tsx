import { interpolate, useCurrentFrame } from "remotion";
import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import { EASING_ENTER } from "@/remotion/lib/timing";
import type { SplitUnitState } from "@/remotion/lib/text-split";

export type StrokeFillDirection = "up" | "down" | "left" | "right";

export type StrokeToFillTextProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit"
> & {
  /** Outline weight in px, before it thins into the fill. */
  strokeWidth?: number;
  /** Outline colour. Defaults to `color`. */
  strokeColor?: string;
  /** Colour the letter fills with. Defaults to `color`. */
  fillColor?: string;
  /** Which way the fill floods the letter. */
  direction?: StrokeFillDirection;
  /** Softness of the fill edge, as a share of the glyph. 0 is a hard line. */
  edgeSoftness?: number;
  /** Share of the outline weight left once the letter is full. */
  strokeRetain?: number;
  /**
   * Frames the outline takes to draw. It arrives as a whole word, not per
   * character — see the note on the component.
   */
  outlineInFrames?: number;
};

const GRADIENT_DIRECTION: Record<StrokeFillDirection, string> = {
  up: "to top",
  down: "to bottom",
  left: "to left",
  right: "to right",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Draws each letter as an outline, then floods it solid.
 *
 * Both layers are the same `<span>` of real text stacked on itself, so the
 * outline and the fill are guaranteed to be the same glyph at the same metrics
 * — tracing the fill with a second element positioned by hand drifts by a
 * fraction of a pixel and the outline reads as a drop shadow.
 *
 * The flood is a gradient mask rather than a `background-clip` trick because a
 * mask can move, and the moving edge is the effect.
 *
 * **The outline is not staggered; the fill is.** They ran on one clock first,
 * and a slow stagger then left the un-flooded half of the line completely
 * absent — the word looked truncated rather than outlined. The whole outline
 * therefore draws once, on `delayInFrames` + `outlineInFrames`, and the stagger
 * is spent entirely on the flood, which is the part the eye is meant to follow.
 */
export const StrokeToFillText: React.FC<StrokeToFillTextProps> = ({
  strokeWidth = 2,
  strokeColor,
  fillColor,
  direction = "up",
  edgeSoftness = 0.12,
  strokeRetain = 0.35,
  outlineInFrames = 16,
  color = "#f4f4f5",
  delayInFrames = 0,
  ...splitProps
}) => {
  const frame = useCurrentFrame();
  const stroke = strokeColor ?? color;
  const fill = fillColor ?? color;
  const softness = Math.max(0, edgeSoftness) * 100;

  const outline = interpolate(
    frame,
    [delayInFrames, delayInFrames + Math.max(1, outlineInFrames)],
    [0, 1],
    { easing: EASING_ENTER, ...clamp },
  );

  const renderUnit = (unit: SplitUnitState) => {
    const flooded = interpolate(unit.enter, [0.1, 1], [0, 1], clamp);
    // The exit drains the letter back to its outline before it fades.
    const fillProgress = flooded * (1 - unit.exit);
    const stop = fillProgress * 100;
    const mask = `linear-gradient(${GRADIENT_DIRECTION[direction]}, #000 ${stop.toFixed(2)}%, rgba(0,0,0,0) ${Math.min(100, stop + softness).toFixed(2)}%)`;
    const weight = strokeWidth * (1 - (1 - strokeRetain) * fillProgress);

    return (
      <span
        style={{
          position: "relative",
          display: "inline-block",
          whiteSpace: "pre",
        }}
      >
        <span
          style={{
            display: "inline-block",
            color: "transparent",
            WebkitTextStrokeWidth: `${weight.toFixed(3)}px`,
            WebkitTextStrokeColor: stroke,
            // The outline holds through the flood and only leaves on the exit.
            opacity: outline * (1 - unit.exit),
          }}
        >
          {unit.text}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "inline-block",
            color: fill,
            opacity: unit.opacity,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        >
          {unit.text}
        </span>
      </span>
    );
  };

  return (
    <SplitTextChars
      {...splitProps}
      color={color}
      delayInFrames={delayInFrames}
      effect="none"
      renderUnit={renderUnit}
    />
  );
};
