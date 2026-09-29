import { cubicBezierAt, noise3, resolveAnimatable, type Animatable } from "./ae-motion";
import { staggerRanks } from "./text-split";

/**
 * After Effects text selectors as pure maths: given a unit's index, how much
 * of an animator's effect does it receive?
 *
 * An animator never animates characters directly. It declares a target
 * ("opacity 0, 40px down") and a selector decides, per unit, how much of that
 * target applies — so the motion comes from animating the *selector* (usually
 * its offset), and one keyframe pair moves a whole line.
 */

type A = Animatable<number>;

export type SelectorShape = "square" | "ramp-up" | "ramp-down" | "triangle" | "round" | "smooth";

/** How a selector combines with the ones above it in the same animator. */
export type SelectorMode = "add" | "subtract" | "intersect" | "min" | "max" | "difference";

/** What one selector unit is. Spaces count only for `characters`. */
export type SelectorBasis = "characters" | "characters-excluding-spaces" | "words" | "lines";

export type RangeSelector = {
  type?: "range";
  /** 0–1 (or unit indices when `units: "index"`). */
  start?: A;
  end?: A;
  /** Added to both start and end. -1…1; animate this to sweep. */
  offset?: A;
  units?: "percentage" | "index";
  shape?: SelectorShape;
  /** -1…1. Positive flattens the top of the curve, negative sharpens it. */
  easeHigh?: number;
  /** -1…1. Positive flattens the bottom of the curve. */
  easeLow?: number;
  /** 0–1, square only: 1 gives partly-covered units a partial value. */
  smoothness?: number;
  randomizeOrder?: boolean;
  seed?: number;
  mode?: SelectorMode;
  /** -1…1 multiplier on the result. */
  amount?: A;
};

export type WigglySelector = {
  type: "wiggly";
  /** -1…1 */
  minAmount?: A;
  /** -1…1 */
  maxAmount?: A;
  wigglesPerSecond?: A;
  /** 0 = every unit on its own, 1 = all units move together. */
  correlation?: number;
  temporalPhase?: A;
  spatialPhase?: A;
  seed?: number;
  mode?: SelectorMode;
};

export type TextSelector = RangeSelector | WigglySelector;

export type SelectorContext = { frame: number; fps: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const num = (value: A | undefined, fallback: number, ctx: SelectorContext) =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

/**
 * Ease High / Ease Low as a cubic bézier on the selection value. Positive
 * values pull the handle along x (flat, slow), negative along y (steep).
 */
export function easeSelection(value: number, easeLow = 0, easeHigh = 0): number {
  if (easeLow === 0 && easeHigh === 0) return value;
  const low = clamp(easeLow, -1, 1);
  const high = clamp(easeHigh, -1, 1);
  const x1 = low > 0 ? low : 0;
  const y1 = low < 0 ? -low : 0;
  const x2 = high > 0 ? 1 - high : 1;
  const y2 = high < 0 ? 1 + high : 1;
  return cubicBezierAt(x1, y1, x2, y2, clamp(value, 0, 1));
}

/**
 * Shape value for a unit whose centre sits at `t` through the range (0 at
 * `start`, 1 at `end`). Ramps are one-sided, as in AE: Ramp Up is 0 before
 * the range and stays fully selected after it, which is what makes a sweeping
 * offset reveal a line and then leave it revealed.
 */
function shapeValue(shape: SelectorShape, t: number): number {
  switch (shape) {
    case "ramp-up":
      return clamp(t, 0, 1);
    case "ramp-down":
      return clamp(1 - t, 0, 1);
    default:
      break;
  }
  if (t < 0 || t > 1) return 0;
  switch (shape) {
    case "triangle":
      return 1 - Math.abs(t * 2 - 1);
    case "round":
      return Math.sqrt(Math.max(0, 1 - (t * 2 - 1) ** 2));
    case "smooth":
      return (1 - Math.cos(t * Math.PI * 2)) / 2;
    default:
      return 1;
  }
}

/** Range selector values for `total` units, in document order. */
export function rangeSelectorValues(
  selector: RangeSelector,
  total: number,
  ctx: SelectorContext,
): number[] {
  if (total <= 0) return [];
  const byIndex = selector.units === "index";
  const scale = byIndex ? 1 / total : 1;
  const offset = num(selector.offset, 0, ctx) * scale;
  let start = num(selector.start, 0, ctx) * scale + offset;
  let end = num(selector.end, byIndex ? total : 1, ctx) * scale + offset;
  if (start > end) [start, end] = [end, start];
  const shape = selector.shape ?? "square";
  const smoothness = clamp(selector.smoothness ?? 1, 0, 1);
  const amount = clamp(num(selector.amount, 1, ctx), -1, 1);
  const ranks = selector.randomizeOrder
    ? staggerRanks(total, "random", selector.seed ?? 1)
    : null;

  return Array.from({ length: total }, (_, index) => {
    const slot = ranks ? ranks[index] : index;
    const lo = slot / total;
    const hi = (slot + 1) / total;
    const centre = (lo + hi) / 2;
    let value: number;

    if (shape === "square") {
      const hard = centre >= start && centre < end ? 1 : 0;
      const covered = Math.max(0, Math.min(hi, end) - Math.max(lo, start)) * total;
      value = hard + (clamp(covered, 0, 1) - hard) * smoothness;
    } else {
      const span = end - start;
      // A zero-width range is a step at `start` for the one-sided ramps.
      const t = span <= 1e-9 ? (centre >= start ? 1.0001 : -0.0001) : (centre - start) / span;
      value = easeSelection(shapeValue(shape, t), selector.easeLow, selector.easeHigh);
    }
    return value * amount;
  });
}

/** Wiggly selector values: each unit drifts between min and max over time. */
export function wigglySelectorValues(
  selector: WigglySelector,
  total: number,
  ctx: SelectorContext,
): number[] {
  const min = clamp(num(selector.minAmount, -1, ctx), -1, 1);
  const max = clamp(num(selector.maxAmount, 1, ctx), -1, 1);
  const time = (ctx.frame / ctx.fps) * num(selector.wigglesPerSecond, 2, ctx) + num(selector.temporalPhase, 0, ctx);
  const spatial = num(selector.spatialPhase, 0, ctx);
  const spacing = (1 - clamp(selector.correlation ?? 0.5, 0, 1)) * 0.7;
  const seed = Math.round(selector.seed ?? 1);
  return Array.from({ length: total }, (_, index) => {
    const n = clamp(noise3(index * spacing + spatial, 0.5, time, seed) * 1.6, -1, 1);
    return min + ((n + 1) / 2) * (max - min);
  });
}

function combine(mode: SelectorMode, previous: number | null, value: number): number {
  if (previous === null) {
    // AE treats "nothing above" as fully selected for Subtract, so a lone
    // subtracting selector inverts its own range.
    return mode === "subtract" ? 1 - value : value;
  }
  switch (mode) {
    case "subtract":
      return clamp(previous - value, -1, 1);
    case "intersect":
      return previous * value;
    case "min":
      return Math.min(previous, value);
    case "max":
      return Math.max(previous, value);
    case "difference":
      return Math.abs(previous - value);
    default:
      return clamp(previous + value, -1, 1);
  }
}

/**
 * Final selection per unit for an animator's selector list, combined top to
 * bottom with each selector's mode. No selectors selects everything.
 */
export function evaluateSelectors(
  selectors: readonly TextSelector[],
  total: number,
  ctx: SelectorContext,
): number[] {
  if (selectors.length === 0) return Array.from({ length: total }, () => 1);
  let result: Array<number | null> = Array.from({ length: total }, () => null);
  for (const selector of selectors) {
    const values =
      selector.type === "wiggly"
        ? wigglySelectorValues(selector, total, ctx)
        : rangeSelectorValues(selector, total, ctx);
    const mode = selector.mode ?? "add";
    result = values.map((value, index) => combine(mode, result[index], value));
  }
  return result.map((value) => value ?? 0);
}

export type TextUnitIndex = {
  characters: number;
  "characters-excluding-spaces": number;
  words: number;
  lines: number;
};

/**
 * Selector index of every glyph under each basis. `characters` counts one
 * space per word gap, as AE does; the other bases ignore spaces.
 */
export function indexGlyphs(
  lines: ReadonlyArray<ReadonlyArray<ReadonlyArray<string>>>,
): { glyphs: TextUnitIndex[]; totals: TextUnitIndex } {
  const glyphs: TextUnitIndex[] = [];
  let characters = 0;
  let visible = 0;
  let words = 0;
  lines.forEach((line, lineIndex) => {
    line.forEach((word, wordIndex) => {
      if (wordIndex > 0) characters += 1;
      word.forEach(() => {
        glyphs.push({
          characters,
          "characters-excluding-spaces": visible,
          words,
          lines: lineIndex,
        });
        characters += 1;
        visible += 1;
      });
      words += 1;
    });
    // A line break is a character in AE's count too.
    characters += 1;
  });
  return {
    glyphs,
    totals: {
      characters: Math.max(0, characters - 1),
      "characters-excluding-spaces": visible,
      words,
      lines: lines.length,
    },
  };
}
