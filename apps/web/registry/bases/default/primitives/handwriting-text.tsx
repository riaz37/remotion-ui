import { random } from "remotion";
import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import type { SplitUnitState } from "@/remotion/lib/text-split";

export type HandwritingTextProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit" | "order" | "mode"
> & {
  /** Diameter of the nib, in em. 0 hides it. */
  penSize?: number;
  /** Nib colour. Defaults to `color`. */
  penColor?: string;
  /** Softness of the ink edge, as a share of one glyph. 0 is a hard cut. */
  inkSoftness?: number;
  /** Per-character tilt and baseline drift, in degrees. 0 is machine-even. */
  wobble?: number;
  /**
   * Varies the hand. Two of these on one frame with the same seed wobble
   * identically, which is what gives away that they are the same component.
   */
  seed?: string | number;
};

/**
 * Deterministic ±1 from Remotion's seeded generator (doc rule 2). `Math.random`
 * would resample on every render pass, and the `Math.sin(x) * 43758.5453` idiom
 * this replaces is a GLSL trick that drifts across JS float paths and cannot be
 * re-seeded per instance.
 */
function jitter(seed: string | number, index: number, salt: number): number {
  return random(`${seed}-${index}-${salt}`) * 2 - 1;
}

/**
 * Writes a string on, character by character.
 *
 * **This takes a string; `path-draw` takes a path.** That is the whole
 * distinction. A string has no stroke order, so the ink is revealed by a
 * left-to-right wipe per glyph with a nib riding the wet edge, rather than by
 * stroking a real outline — for a signature or a logogram, where the stroke
 * order is the point, give `path-draw` the actual path.
 *
 * `order` is not a prop: writing runs left to right, and re-ranking the stagger
 * would produce a word that assembles out of sequence, which reads as a glitch
 * rather than as a hand.
 *
 * The default family is a script stack. Pass a webfont via `fontFamily` for a
 * result that is identical on every render machine — the generic `cursive`
 * fallback resolves to whatever the host has.
 */
export const HandwritingText: React.FC<HandwritingTextProps> = ({
  penSize = 0.14,
  penColor,
  inkSoftness = 0.18,
  wobble = 1.6,
  seed = "handwriting",
  color = "#f4f4f5",
  fontFamily = '"Segoe Script", "Bradley Hand", "Snell Roundhand", cursive',
  staggerInFrames = 3,
  durationInFrames = 10,
  ...splitProps
}) => {
  const nib = penColor ?? color;
  const softness = Math.max(0, inkSoftness) * 100;

  const renderUnit = (unit: SplitUnitState) => {
    const written = Math.max(0, Math.min(1, unit.enter));
    const stop = written * 100;
    const ink = `linear-gradient(to right, #000 ${stop.toFixed(2)}%, rgba(0,0,0,0) ${Math.min(100, stop + softness).toFixed(2)}%)`;
    // A hand does not sit on the baseline. The tilt is fixed per character so
    // the word does not wriggle after it is written.
    const tilt = jitter(seed, unit.index, 1) * wobble;
    const drift = jitter(seed, unit.index, 2) * wobble * 0.012;
    const writing = written > 0.02 && written < 0.98;

    return (
      <span
        style={{
          position: "relative",
          display: "inline-block",
          whiteSpace: "pre",
          opacity: unit.opacity,
          rotate: `${tilt.toFixed(3)}deg`,
          translate: `0 ${drift.toFixed(4)}em`,
        }}
      >
        <span
          style={{
            display: "inline-block",
            maskImage: ink,
            WebkitMaskImage: ink,
          }}
        >
          {unit.text}
        </span>
        {penSize > 0 ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${stop.toFixed(2)}%`,
              bottom: "0.08em",
              width: `${penSize}em`,
              height: `${penSize}em`,
              marginLeft: `${(-penSize / 2).toFixed(4)}em`,
              borderRadius: "50%",
              background: nib,
              opacity: writing ? unit.opacity : 0,
            }}
          />
        ) : null}
      </span>
    );
  };

  return (
    <SplitTextChars
      {...splitProps}
      color={color}
      fontFamily={fontFamily}
      mode="chars"
      order="start"
      staggerInFrames={staggerInFrames}
      durationInFrames={durationInFrames}
      effect="none"
      renderUnit={renderUnit}
    />
  );
};
