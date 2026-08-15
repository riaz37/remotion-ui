import {
  SplitTextChars,
  type SplitTextCharsProps,
} from "@/remotion/primitives/split-text-chars";
import { useCurrentFrame } from "remotion";
import type { SplitUnitState } from "@/remotion/lib/text-split";

export type ScrambleCharset = "latin" | "symbols" | "digits" | "blocks";

export type ScrambleTextProps = Omit<
  SplitTextCharsProps,
  "effect" | "renderUnit"
> & {
  /** Glyph pool the noise is drawn from. Pass a string for a custom pool. */
  charset?: ScrambleCharset | string;
  /** Frames one noise glyph is held for. 1 is a blur, 4 is a slot machine. */
  tickInFrames?: number;
  /** Colour of the unresolved glyphs. Defaults to the resolved colour. */
  scrambleColor?: string;
  /** Opacity of the unresolved glyphs. */
  scrambleOpacity?: number;
  /** Scramble again on the way out. */
  scrambleOnExit?: boolean;
};

const CHARSETS: Record<ScrambleCharset, string> = {
  latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  symbols: "!<>-_\\/[]{}—=+*^?#%$&@~",
  digits: "0123456789",
  blocks: "░▒▓█▚▞▙▟▛▜╱╲",
};

function resolveCharset(charset: ScrambleCharset | string): string {
  return CHARSETS[charset as ScrambleCharset] ?? charset;
}

/**
 * Deterministic glyph pick.
 *
 * `Math.random()` would resample on every React render, so the same frame would
 * scramble differently between the preview and the render — and a render is
 * many passes over the same frame.
 */
function pickGlyph(pool: string, index: number, tick: number, seed: number) {
  const noise = Math.sin(index * 92.13 + tick * 41.77 + seed * 311.7) * 43758.5453;
  const position = Math.floor((noise - Math.floor(noise)) * pool.length);
  return pool[Math.min(pool.length - 1, Math.max(0, position))] ?? "";
}

/**
 * Resolves each character out of random glyph noise.
 *
 * Every character runs its own scramble on its own clock, so `order="center"`
 * or `order="random"` resolves the word out of noise in that shape. That is the
 * line against `matrix-decode`, which resolves strictly left to right on one
 * shared progress value and cannot do anything else.
 *
 * Monospace is the default family on purpose: a proportional face re-flows the
 * line on every tick as the noise glyphs change width, and the whole word
 * jitters sideways.
 */
export const ScrambleText: React.FC<ScrambleTextProps> = ({
  charset = "symbols",
  tickInFrames = 2,
  scrambleColor,
  scrambleOpacity = 0.72,
  scrambleOnExit = true,
  fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace",
  seed = 1,
  ...splitProps
}) => {
  const frame = useCurrentFrame();
  const pool = resolveCharset(charset);
  const tick = Math.floor(frame / Math.max(1, Math.round(tickInFrames)));

  const renderUnit = (unit: SplitUnitState) => {
    const scrambling =
      unit.enter < 1 || (scrambleOnExit && unit.exit > 0 && unit.exit < 1);
    const glyph = scrambling
      ? pickGlyph(pool, unit.index, tick + unit.index, seed)
      : unit.text;

    // Noise reaches full strength three times faster than the built-in fade:
    // the glyph churn *is* the effect, so it has to be legible from the first
    // frame of a unit's window rather than arriving with it.
    const opacity = scrambling
      ? Math.min(1, unit.opacity * 3) * scrambleOpacity
      : unit.opacity;

    return (
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          opacity,
          ...(scrambling && scrambleColor ? { color: scrambleColor } : null),
        }}
      >
        {glyph}
      </span>
    );
  };

  return (
    <SplitTextChars
      {...splitProps}
      seed={seed}
      fontFamily={fontFamily}
      effect="none"
      renderUnit={renderUnit}
    />
  );
};
