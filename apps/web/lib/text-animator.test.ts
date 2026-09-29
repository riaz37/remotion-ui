import { describe, expect, it } from "vitest";
import { layoutGlyphs, type MeasureFn } from "../registry/bases/default/lib/glyph-layout";
import {
  easeSelection,
  evaluateSelectors,
  indexGlyphs,
  rangeSelectorValues,
  wigglySelectorValues,
} from "../registry/bases/default/lib/text-selectors";

const ctx = { frame: 0, fps: 30 };
const round = (values: number[]) => values.map((v) => Math.round(v * 1000) / 1000);

describe("range selector shapes", () => {
  it("square with no smoothness selects units whose centre is in range", () => {
    const values = rangeSelectorValues({ start: 0.25, end: 0.75, smoothness: 0 }, 4, ctx);
    expect(values).toEqual([0, 1, 1, 0]);
  });

  it("square with smoothness gives partly covered units a partial value", () => {
    const values = rangeSelectorValues({ start: 0.125, end: 1 }, 4, ctx);
    expect(round(values)).toEqual([0.5, 1, 1, 1]);
  });

  it("ramp up is 0 before the range and stays selected after it", () => {
    const values = rangeSelectorValues({ shape: "ramp-up", start: 0.25, end: 0.5 }, 8, ctx);
    expect(values[0]).toBe(0);
    expect(values[7]).toBe(1);
    expect(values[2]).toBeGreaterThan(0);
    expect(values[2]).toBeLessThan(1);
  });

  it("ramp down mirrors ramp up", () => {
    const up = rangeSelectorValues({ shape: "ramp-up", start: 0.2, end: 0.8 }, 10, ctx);
    const down = rangeSelectorValues({ shape: "ramp-down", start: 0.2, end: 0.8 }, 10, ctx);
    up.forEach((v, i) => expect(v + down[i]).toBeCloseTo(1));
  });

  it("triangle, round and smooth peak in the middle and vanish outside", () => {
    for (const shape of ["triangle", "round", "smooth"] as const) {
      const values = rangeSelectorValues({ shape, start: 0.2, end: 0.8 }, 10, ctx);
      expect(values[0]).toBe(0);
      expect(values[9]).toBe(0);
      expect(Math.max(...values)).toBeGreaterThan(0.8);
      expect(values[4]).toBeGreaterThan(values[2]);
    }
  });

  it("offset slides the range", () => {
    const values = rangeSelectorValues({ start: 0, end: 0.25, offset: 0.5, smoothness: 0 }, 4, ctx);
    expect(values).toEqual([0, 0, 1, 0]);
  });

  it("index units address units by count", () => {
    const values = rangeSelectorValues({ units: "index", start: 1, end: 3, smoothness: 0 }, 5, ctx);
    expect(values).toEqual([0, 1, 1, 0, 0]);
  });

  it("amount scales and can invert the effect", () => {
    const values = rangeSelectorValues({ amount: -0.5 }, 3, ctx);
    expect(values).toEqual([-0.5, -0.5, -0.5]);
  });

  it("randomize order keeps the count but shuffles which units are selected", () => {
    const ordered = rangeSelectorValues({ start: 0, end: 0.5, smoothness: 0 }, 10, ctx);
    const shuffled = rangeSelectorValues({ start: 0, end: 0.5, smoothness: 0, randomizeOrder: true, seed: 3 }, 10, ctx);
    expect(shuffled.reduce((a, b) => a + b, 0)).toBe(ordered.reduce((a, b) => a + b, 0));
    expect(shuffled).not.toEqual(ordered);
    expect(
      rangeSelectorValues({ start: 0, end: 0.5, smoothness: 0, randomizeOrder: true, seed: 3 }, 10, ctx),
    ).toEqual(shuffled);
  });

  it("animates through keyframes", () => {
    const selector = {
      start: 0,
      end: [
        { frame: 0, value: 0 },
        { frame: 10, value: 1 },
      ],
      smoothness: 0,
    };
    expect(rangeSelectorValues(selector, 4, { frame: 5, fps: 30 })).toEqual([1, 1, 0, 0]);
  });
});

describe("ease high and low", () => {
  it("leaves the ends fixed and bends the middle", () => {
    expect(easeSelection(0, 0.5, 0.5)).toBeCloseTo(0);
    expect(easeSelection(1, 0.5, 0.5)).toBeCloseTo(1);
    expect(easeSelection(0.2, 0.8, 0)).toBeLessThan(0.2);
    expect(easeSelection(0.8, 0, 0.8)).toBeGreaterThan(0.8);
  });
});

describe("wiggly selector and combine modes", () => {
  it("stays inside min and max and is deterministic", () => {
    const selector = { type: "wiggly" as const, minAmount: 0.2, maxAmount: 0.6, seed: 4 };
    const values = wigglySelectorValues(selector, 20, { frame: 17, fps: 30 });
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0.2);
      expect(v).toBeLessThanOrEqual(0.6);
    });
    expect(wigglySelectorValues(selector, 20, { frame: 17, fps: 30 })).toEqual(values);
  });

  it("selects everything with no selectors", () => {
    expect(evaluateSelectors([], 3, ctx)).toEqual([1, 1, 1]);
  });

  it("a lone subtract inverts its range", () => {
    const values = evaluateSelectors([{ start: 0, end: 0.5, smoothness: 0, mode: "subtract" }], 4, ctx);
    expect(values).toEqual([0, 0, 1, 1]);
  });

  it("intersect keeps only the overlap", () => {
    const values = evaluateSelectors(
      [
        { start: 0, end: 0.75, smoothness: 0 },
        { start: 0.25, end: 1, smoothness: 0, mode: "intersect" },
      ],
      4,
      ctx,
    );
    expect(values).toEqual([0, 1, 1, 0]);
  });
});

describe("indexGlyphs", () => {
  it("counts spaces only for the characters basis", () => {
    const { glyphs, totals } = indexGlyphs([[["a", "b"], ["c"]], [["d"]]]);
    expect(glyphs.map((g) => g.characters)).toEqual([0, 1, 3, 5]);
    expect(glyphs.map((g) => g["characters-excluding-spaces"])).toEqual([0, 1, 2, 3]);
    expect(glyphs.map((g) => g.words)).toEqual([0, 0, 1, 2]);
    expect(glyphs.map((g) => g.lines)).toEqual([0, 0, 0, 1]);
    expect(totals).toEqual({ characters: 6, "characters-excluding-spaces": 4, words: 3, lines: 2 });
  });
});

describe("glyph layout", () => {
  // Fixed-advance font: every glyph, space included, is 0.5em wide.
  const mono: MeasureFn = (text, size) => Array.from(text).length * size * 0.5;

  it("wraps on words and never splits one", () => {
    const layout = layoutGlyphs({ text: "aaaa bbbb cccc", fontSize: 10, maxWidth: 40, measure: mono });
    expect(layout.lines.map((l) => l.words.map((w) => w.glyphs.map((g) => g.char).join("")))).toEqual([
      ["aaaa"],
      ["bbbb"],
      ["cccc"],
    ]);
  });

  it("keeps words together on one line when they fit", () => {
    const layout = layoutGlyphs({ text: "aa bb", fontSize: 10, maxWidth: 100, measure: mono });
    expect(layout.lines).toHaveLength(1);
    expect(layout.glyphs.map((g) => g.x)).toEqual([0, 5, 15, 20]);
    expect(layout.width).toBe(25);
  });

  it("honours explicit line breaks", () => {
    const layout = layoutGlyphs({ text: "a\nb", fontSize: 10, maxWidth: 999, measure: mono, lineHeight: 1.5 });
    expect(layout.lines).toHaveLength(2);
    expect(layout.lines[1].y).toBe(15);
    expect(layout.height).toBe(30);
  });

  it("shrinks the type only when one word cannot fit", () => {
    const layout = layoutGlyphs({ text: "abcdefghij", fontSize: 20, maxWidth: 50, minFontSize: 4, measure: mono });
    expect(layout.fontSize).toBeCloseTo(10);
    expect(layout.width).toBeLessThanOrEqual(50 + 1e-9);
  });

  it("adds letter spacing after every glyph", () => {
    const layout = layoutGlyphs({ text: "ab", fontSize: 10, maxWidth: 999, measure: mono, letterSpacing: 0.1 });
    expect(layout.glyphs[1].x).toBeCloseTo(6);
    expect(layout.glyphs[1].width).toBeCloseTo(6);
  });

  it("uses measured prefixes, so kerning pairs survive", () => {
    // "AV" kerns 2px tighter than its parts.
    const kerned: MeasureFn = (text, size) => mono(text, size) - (text.includes("AV") ? 2 : 0);
    const layout = layoutGlyphs({ text: "AVA", fontSize: 10, maxWidth: 999, measure: kerned });
    expect(layout.glyphs.map((g) => g.x)).toEqual([0, 5, 8]);
  });

  it("rejects nonsense sizes", () => {
    expect(() => layoutGlyphs({ text: "a", fontSize: 0, maxWidth: 10, measure: mono })).toThrow(/positive/);
  });
});
