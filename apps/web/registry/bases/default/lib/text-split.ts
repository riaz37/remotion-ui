import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  defaultExitFrames,
  resolveSpringConfig,
  type MotionSpring,
} from "./motion-primitive";
import { EASING_ENTER, EASING_EXIT } from "./timing";

/**
 * The splitting layer every text effect composes against.
 *
 * Before this existed, `tracking-in`, `slot-roll`, `matrix-decode` and
 * `staggered-fade-up` each carried their own `text.split(...)` plus their own
 * stagger arithmetic, and they disagreed: one broke on `\s+`, one on `""`, and
 * none of them kept a word intact when the line wrapped. A character split that
 * lets a word break mid-word is the single most visible failure mode of this
 * whole family, so the structure — not just the timing — is shared here.
 *
 * Two rules the shape encodes:
 *
 * 1. **The layout is always three levels: line → word → unit.** The mode only
 *    decides what a unit *is* (a character, a word, or a whole line). A
 *    renderer written once against that shape is correct in all three modes,
 *    and a word rendered as one inline-block can never break across a line.
 * 2. **Stagger order is a rank, not an index.** `order` re-ranks the units
 *    without touching their document order, so "centre out" and "random" cost
 *    nothing extra and never reorder the text itself.
 */

export type SplitMode = "chars" | "words" | "lines";

/** Which unit animates first. Document order is never affected. */
export type SplitOrder = "start" | "end" | "center" | "edges" | "random";

export type SplitUnit = {
  /** The text this unit draws. */
  text: string;
  /** Stagger ordinal across the whole string, in document order. */
  index: number;
  /** Total number of units, so an effect can normalise `index`. */
  total: number;
  lineIndex: number;
  /** Word ordinal across the whole string. */
  wordIndex: number;
  indexInWord: number;
  indexInLine: number;
};

export type SplitWord = {
  text: string;
  /** Word ordinal across the whole string. */
  index: number;
  lineIndex: number;
  indexInLine: number;
  units: SplitUnit[];
};

export type SplitLine = {
  text: string;
  index: number;
  words: SplitWord[];
  units: SplitUnit[];
};

export type SplitResult = {
  mode: SplitMode;
  lines: SplitLine[];
  words: SplitWord[];
  /** Flat, in document order. `unit.index` is the position in this array. */
  units: SplitUnit[];
  total: number;
};

/**
 * Lines are explicit `\n` breaks, never measured visual wraps.
 *
 * Measuring where the browser wrapped requires a layout pass, which is not
 * available on the first frame of a headless render — a measured split renders
 * one thing at frame 0 and another at frame 1. Callers who want per-visual-line
 * motion pass the breaks in.
 */
function toLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/** Splits on runs of whitespace and drops the runs; gaps are drawn by layout. */
function toWords(line: string): string[] {
  return line.split(/\s+/).filter((word) => word.length > 0);
}

/**
 * Splits by code point rather than by UTF-16 unit, so an emoji or an accented
 * glyph stays one unit instead of rendering as two broken halves.
 */
function toChars(word: string): string[] {
  return Array.from(word);
}

/**
 * Builds the line → word → unit tree for a string.
 *
 * Pure and frame-independent: safe to call inside `useMemo`, and used by the
 * headless hook as well as by effects that only want the structure.
 */
export function splitText(text: string, mode: SplitMode = "chars"): SplitResult {
  const units: SplitUnit[] = [];
  const words: SplitWord[] = [];
  const lines: SplitLine[] = [];

  const rawLines = toLines(text);

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex += 1) {
    const rawLine = rawLines[lineIndex];
    const lineWords: SplitWord[] = [];
    const lineUnits: SplitUnit[] = [];

    // A line-mode unit is the whole line, so the word level collapses to one
    // entry rather than disappearing — the three-level shape is invariant.
    const rawWords =
      mode === "lines" ? [rawLine.trim()].filter(Boolean) : toWords(rawLine);

    for (let indexInLine = 0; indexInLine < rawWords.length; indexInLine += 1) {
      const rawWord = rawWords[indexInLine];
      const wordUnits: SplitUnit[] = [];
      const pieces = mode === "chars" ? toChars(rawWord) : [rawWord];

      const word: SplitWord = {
        text: rawWord,
        index: words.length,
        lineIndex,
        indexInLine,
        units: wordUnits,
      };

      for (let indexInWord = 0; indexInWord < pieces.length; indexInWord += 1) {
        const unit: SplitUnit = {
          text: pieces[indexInWord],
          index: units.length,
          // Patched below: the total is not known until every line is walked.
          total: 0,
          lineIndex,
          wordIndex: word.index,
          indexInWord,
          indexInLine: lineUnits.length,
        };
        units.push(unit);
        lineUnits.push(unit);
        wordUnits.push(unit);
      }

      words.push(word);
      lineWords.push(word);
    }

    lines.push({
      text: rawLine,
      index: lineIndex,
      words: lineWords,
      units: lineUnits,
    });
  }

  const total = units.length;
  for (const unit of units) {
    unit.total = total;
  }

  return { mode, lines, words, units, total };
}

/** Deterministic 0-1 hash. `Math.random()` would resample on every frame. */
function hash01(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Stagger rank per unit, 0 = animates first.
 *
 * Returned as a whole array rather than a per-index function because `random`
 * has to rank the set against itself; ranking one unit at a time would let two
 * units collide on the same slot and leave gaps in the stagger.
 */
export function staggerRanks(
  total: number,
  order: SplitOrder = "start",
  seed = 1,
): number[] {
  if (total <= 0) {
    return [];
  }

  const indices = Array.from({ length: total }, (_, index) => index);
  const middle = (total - 1) / 2;

  switch (order) {
    case "end":
      return indices.map((index) => total - 1 - index);
    case "center":
      return indices.map((index) => Math.round(Math.abs(index - middle)));
    case "edges":
      return indices.map((index) =>
        Math.round(middle - Math.abs(index - middle)),
      );
    case "random": {
      const shuffled = [...indices].sort(
        (a, b) => hash01(a, seed) - hash01(b, seed),
      );
      const ranks = new Array<number>(total);
      shuffled.forEach((originalIndex, rank) => {
        ranks[originalIndex] = rank;
      });
      return ranks;
    }
    default:
      return indices;
  }
}

export type SplitTimingOptions = {
  mode?: SplitMode;
  /** Frames between one unit starting and the next. */
  staggerInFrames?: number;
  /** Length of one unit's entrance. */
  durationInFrames?: number;
  /** Frames before the first unit starts. */
  delayInFrames?: number;
  order?: SplitOrder;
  /** Seed for `order: "random"`. Same seed renders the same shuffle. */
  seed?: number;
  /** Drive the entrance with a spring instead of the ease-out curve. */
  spring?: MotionSpring;
  /** Animate back out. Lands inside the surrounding Sequence by default. */
  exit?: boolean;
  /** Length of one unit's exit. Defaults to 70% of `durationInFrames`. */
  exitInFrames?: number;
  /** Frame the first unit's exit starts on. Overrides end-of-window timing. */
  exitAtInFrames?: number;
  /** Frames between one unit exiting and the next. Defaults to the enter stagger. */
  exitStaggerInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence from={...}>`. */
  frame?: number;
};

/** Stagger defaults per mode: a character needs far less spacing than a line. */
export const SPLIT_STAGGER_DEFAULTS: Record<SplitMode, number> = {
  chars: 2,
  words: 4,
  lines: 7,
};

export const SPLIT_DURATION_DEFAULTS: Record<SplitMode, number> = {
  chars: 20,
  words: 24,
  lines: 28,
};

export type SplitUnitState = SplitUnit & {
  /** Frame this unit's entrance starts on. */
  delayInFrames: number;
  /** Stagger position, 0 = first. */
  rank: number;
  /** 0→1 entrance. May overshoot 1 when driven by a bouncy spring. */
  enter: number;
  /** 0→1 exit. Stays 0 when no exit was requested. */
  exit: number;
  /** How far from rest the unit is — multiply travel distances by this. */
  displace: number;
  /** Opacity channel. Leads the transform in and out. */
  opacity: number;
  /** `enter` with the exit taken back out. The value most effects want. */
  value: number;
};

export type SplitTextState = {
  mode: SplitMode;
  /** Nested for layout. Render lines → words → units and a word never breaks. */
  lines: Array<{
    text: string;
    index: number;
    words: Array<{
      text: string;
      index: number;
      lineIndex: number;
      indexInLine: number;
      units: SplitUnitState[];
    }>;
  }>;
  /** Flat, in document order. */
  units: SplitUnitState[];
  total: number;
  /** Frame the last unit finishes its entrance on — size a Sequence with it. */
  lastEnterFrame: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Opacity is complete this far into a unit's entrance. */
const ENTER_OPACITY_LEAD = 0.55;
const EXIT_OPACITY_LEAD = 0.7;

/**
 * Headless timing for a split string.
 *
 * This is the entry point for effects that draw their own glyphs — a scramble,
 * a stroke fill, a variable-font axis sweep — and never want the built-in look.
 * They get identical splitting and identical stagger semantics for free, which
 * is the whole point of the foundation.
 *
 * ```tsx
 * const { lines } = useSplitText({ text, mode: "chars", order: "center" });
 * // lines[0].words[0].units[0].value → 0→1, already staggered
 * ```
 */
export function useSplitText({
  text,
  mode = "chars",
  staggerInFrames,
  durationInFrames,
  delayInFrames = 0,
  order = "start",
  seed = 1,
  spring: springProp,
  exit = false,
  exitInFrames,
  exitAtInFrames,
  exitStaggerInFrames,
  frame: frameOverride,
}: SplitTimingOptions & { text: string }): SplitTextState {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps, durationInFrames: windowFrames } = useVideoConfig();

  // Every optional field is defaulted before it is read. Spreading an options
  // object straight into `spring()` lets an explicit `undefined` overwrite a
  // default and the whole animation silently resolves to NaN.
  const stagger = staggerInFrames ?? SPLIT_STAGGER_DEFAULTS[mode];
  const duration = Math.max(1, Math.round(durationInFrames ?? SPLIT_DURATION_DEFAULTS[mode]));
  const delay = Math.max(0, Math.round(delayInFrames));
  const exitFrames =
    exitInFrames === undefined
      ? defaultExitFrames(duration)
      : Math.max(1, Math.round(exitInFrames));
  const exitStagger = exitStaggerInFrames ?? stagger;

  const split = splitText(text, mode);
  const ranks = staggerRanks(split.total, order, seed);
  const maxRank = ranks.length > 0 ? Math.max(...ranks) : 0;
  const lastEnterFrame = delay + maxRank * stagger + duration;

  const wantsExit =
    exit || exitInFrames !== undefined || exitAtInFrames !== undefined;
  const hasWindow = Number.isFinite(windowFrames);
  const requestedExit =
    exitAtInFrames ??
    (hasWindow ? windowFrames - exitFrames - maxRank * exitStagger : null);
  /* An exit that starts before the entrance has landed reads as a stutter, so
   * it is pushed behind the entrance rather than overlapping it. */
  const exitStart =
    wantsExit && requestedExit !== null
      ? Math.max(requestedExit, lastEnterFrame)
      : null;

  const springConfig = springProp ? resolveSpringConfig(springProp) : null;

  const stateFor = (unit: SplitUnit): SplitUnitState => {
    const rank = ranks[unit.index] ?? unit.index;
    const start = delay + rank * stagger;

    const enterTime = interpolate(frame, [start, start + duration], [0, 1], clamp);
    const enter = springConfig
      ? spring({
          frame,
          fps,
          config: springConfig,
          delay: start,
          durationInFrames: duration,
        })
      : interpolate(enterTime, [0, 1], [0, 1], {
          easing: EASING_ENTER,
          ...clamp,
        });
    const enterOpacity = interpolate(
      enterTime,
      [0, ENTER_OPACITY_LEAD],
      [0, 1],
      clamp,
    );

    if (exitStart === null) {
      return {
        ...unit,
        rank,
        delayInFrames: start,
        enter,
        exit: 0,
        displace: 1 - enter,
        opacity: enterOpacity,
        value: enter,
      };
    }

    const unitExitStart = exitStart + rank * exitStagger;
    const exitTime = interpolate(
      frame,
      [unitExitStart, unitExitStart + exitFrames],
      [0, 1],
      clamp,
    );
    const exitProgress = interpolate(exitTime, [0, 1], [0, 1], {
      easing: EASING_EXIT,
      ...clamp,
    });
    const exitOpacity = interpolate(
      exitTime,
      [0, EXIT_OPACITY_LEAD],
      [1, 0],
      clamp,
    );

    return {
      ...unit,
      rank,
      delayInFrames: start,
      enter,
      exit: exitProgress,
      displace: exitProgress > 0 ? exitProgress : 1 - enter,
      opacity: enterOpacity * exitOpacity,
      value: enter * (1 - exitProgress),
    };
  };

  const states = split.units.map(stateFor);

  return {
    mode,
    lines: split.lines.map((line) => ({
      text: line.text,
      index: line.index,
      words: line.words.map((word) => ({
        text: word.text,
        index: word.index,
        lineIndex: word.lineIndex,
        indexInLine: word.indexInLine,
        units: word.units.map((unit) => states[unit.index]),
      })),
    })),
    units: states,
    total: split.total,
    lastEnterFrame,
  };
}
