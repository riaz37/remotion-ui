import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type SlotRollProps = {
  from: string;
  to: string;
  durationInFrames?: number;
  delayInFrames?: number;
  /**
   * Frames between one column starting and the next. A real reel settles
   * left to right; every column landing on the same frame reads as a scramble.
   */
  staggerInFrames?: number;
  /** Full wraps of the pool a column takes before it lands. */
  spins?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

const DIGITS = "0123456789";
const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Monospace by default: a proportional face re-flows the line on every tick. */
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

const DEFAULT_SPINS = 2;

function isNumeric(value: string): boolean {
  return /^[0-9]+$/.test(value.trim());
}

/**
 * One column of the reel.
 *
 * The pool is walked monotonically forwards from the starting glyph to the
 * target — `fromIndex + travel * progress` — so the column decelerates *into*
 * its answer the way an odometer does. The previous version swept the pool
 * index up and back down to zero, which meant the last visible glyph before the
 * landing was a `0` regardless of the target, and the digit snapped.
 */
function rollGlyph(
  fromChar: string,
  toChar: string,
  progress: number,
  pool: string,
  spins: number,
): string {
  if (progress >= 1) return toChar;
  if (progress <= 0) return fromChar;
  if (fromChar === toChar) return toChar;

  const fromIndex = pool.indexOf(fromChar);
  const toIndex = pool.indexOf(toChar);
  if (fromIndex < 0 || toIndex < 0) {
    // A glyph outside the pool (a separator, a space) has nowhere to roll.
    return progress < 0.5 ? fromChar : toChar;
  }

  const forward = (toIndex - fromIndex + pool.length) % pool.length;
  const travel = spins * pool.length + forward;
  const position = fromIndex + travel * progress;
  return pool[Math.floor(position) % pool.length] ?? toChar;
}

export const SlotRoll: React.FC<SlotRollProps> = ({
  from,
  to,
  durationInFrames = 40,
  delayInFrames = 0,
  staggerInFrames = 4,
  spins = DEFAULT_SPINS,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 700,
  fontFamily = MONO_STACK,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(96, width);

  const len = Math.max(from.length, to.length);
  const paddedFrom = from.padStart(len, " ");
  const paddedTo = to.padStart(len, " ");

  /* An odometer that rolls through letters is not an odometer. */
  const pool = isNumeric(from) && isNumeric(to) ? DIGITS : ALPHANUMERIC;

  const stagger = Math.max(0, staggerInFrames);
  const lastStart = stagger * Math.max(0, len - 1);
  /* Each column owns its own window inside the stated duration, so the last
   * one still lands on `delay + durationInFrames`. */
  const columnFrames = Math.max(1, durationInFrames - lastStart);

  const display = Array.from({ length: len }, (_, index) => {
    const start = delayInFrames + index * stagger;
    const progress = interpolate(frame, [start, start + columnFrames], [0, 1], {
      easing: EASING_ENTER,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return rollGlyph(
      paddedFrom[index] ?? " ",
      paddedTo[index] ?? " ",
      progress,
      pool,
      // Alternating spin counts keep two neighbouring columns off the same
      // glyph without reaching for a random number.
      spins + (index % 2),
    );
  }).join("");

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        // The padded columns stay in the layout: trimming them let the
        // rendered width change mid-roll and shifted the whole line.
        whiteSpace: "pre",
      }}
    >
      {display}
    </span>
  );
};
