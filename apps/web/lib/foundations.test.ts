import { getBoundingBox } from "@remotion/paths";
import { describe, expect, it } from "vitest";
import {
  cuesToCaptions,
  parseSubtitles,
  parseSubtitlesToCaptions,
} from "../registry/bases/default/lib/caption-utils";
import {
  displacementFrame,
  displacementIntensity,
  maskFrame,
  prepareMaskMorph,
} from "../registry/bases/default/lib/displacement-transition";
import {
  fitToBox,
  morphBetween,
  morphSequence,
  prepareMorph,
  prepareMorphSequence,
  MORPH_SHAPES,
} from "../registry/bases/default/lib/path-morph";
import {
  splitText,
  staggerRanks,
} from "../registry/bases/default/lib/text-split";

/**
 * The batch-1 foundations are consumed by ~20 downstream components, so their
 * pure halves are pinned here. The React halves are covered by `audit:stills`;
 * these are the invariants a rendered frame cannot show — that a word never
 * splits across a line, that every stagger slot is used exactly once, and that
 * a transition effect is exactly zero when the scene is at rest.
 */

describe("splitText", () => {
  it("keeps characters grouped under their word", () => {
    const result = splitText("ab cd", "chars");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].words.map((word) => word.text)).toEqual(["ab", "cd"]);
    expect(result.lines[0].words[0].units.map((unit) => unit.text)).toEqual(["a", "b"]);
    expect(result.total).toBe(4);
  });

  it("gives every mode the same three-level shape", () => {
    for (const mode of ["chars", "words", "lines"] as const) {
      const result = splitText("one two\nthree", mode);
      expect(result.lines.every((line) => line.words.length > 0)).toBe(true);
      expect(
        result.lines.every((line) =>
          line.words.every((word) => word.units.length > 0),
        ),
      ).toBe(true);
    }
  });

  it("counts one unit per line in lines mode", () => {
    const result = splitText("one two\nthree four", "lines");
    expect(result.total).toBe(2);
    expect(result.units.map((unit) => unit.text)).toEqual([
      "one two",
      "three four",
    ]);
  });

  it("collapses whitespace runs instead of emitting empty units", () => {
    const result = splitText("a   b", "words");
    expect(result.units.map((unit) => unit.text)).toEqual(["a", "b"]);
  });

  it("treats an astral glyph as one unit", () => {
    // "🎬" is a surrogate pair: a naive split("") would render two broken halves.
    expect(splitText("🎬a", "chars").total).toBe(2);
  });

  it("numbers units in document order across lines", () => {
    const result = splitText("a\nb", "chars");
    expect(result.units.map((unit) => unit.index)).toEqual([0, 1]);
    expect(result.units.map((unit) => unit.lineIndex)).toEqual([0, 1]);
  });
});

describe("staggerRanks", () => {
  it("uses every slot exactly once for random order", () => {
    const ranks = staggerRanks(12, "random", 3);
    expect([...ranks].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, index) => index),
    );
  });

  it("is deterministic for a given seed", () => {
    expect(staggerRanks(9, "random", 5)).toEqual(staggerRanks(9, "random", 5));
    expect(staggerRanks(9, "random", 5)).not.toEqual(
      staggerRanks(9, "random", 6),
    );
  });

  it("starts from the middle for center and from the ends for edges", () => {
    const center = staggerRanks(5, "center");
    expect(center.indexOf(0)).toBe(2);
    const edges = staggerRanks(5, "edges");
    expect(edges[0]).toBe(0);
    expect(edges[4]).toBe(0);
  });

  it("reverses for end order", () => {
    expect(staggerRanks(3, "end")).toEqual([2, 1, 0]);
  });
});

describe("parseSubtitles", () => {
  const srt = `1
00:00:01,000 --> 00:00:02,500
First line
wrapped

2
00:00:02,500 --> 00:00:04,000
Second line
`;

  it("reads SRT cues with comma milliseconds", () => {
    const cues = parseSubtitles(srt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({
      text: "First line wrapped",
      startMs: 1000,
      endMs: 2500,
    });
  });

  it("reads WebVTT, skipping the header and metadata blocks", () => {
    const vtt = `WEBVTT

NOTE this is a comment

00:01.000 --> 00:02.000 align:start
<v Ada>Hello there</v>
`;
    const cues = parseSubtitles(vtt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Hello there");
    expect(cues[0].speaker).toBe("Ada");
    expect(cues[0].startMs).toBe(1000);
  });

  it("drops cues that are empty or end before they start", () => {
    expect(parseSubtitles("1\n00:00:02,000 --> 00:00:01,000\nbackwards\n")).toEqual([]);
    expect(parseSubtitles("1\n00:00:00,000 --> 00:00:01,000\n\n")).toEqual([]);
  });

  it("handles CRLF files and a byte order mark", () => {
    const cues = parseSubtitles("﻿1\r\n00:00:00,000 --> 00:00:01,000\r\nHi\r\n");
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Hi");
  });
});

describe("cuesToCaptions", () => {
  const cues = parseSubtitles("1\n00:00:00,000 --> 00:00:01,000\nab cdef\n");

  it("distributes a cue across its words by length", () => {
    const captions = cuesToCaptions(cues, "distribute");
    expect(captions.map((caption) => caption.text)).toEqual([" ab", " cdef"]);
    // Weights are 3 and 5 of 8, so the split lands at 375ms.
    expect(captions[0].endMs).toBe(375);
    expect(captions[1].startMs).toBe(375);
    expect(captions[1].endMs).toBe(1000);
  });

  it("covers the cue span with no gap and no overlap", () => {
    const captions = cuesToCaptions(cues, "distribute");
    expect(captions[0].startMs).toBe(cues[0].startMs);
    expect(captions[captions.length - 1].endMs).toBe(cues[0].endMs);
  });

  it("keeps the cue whole in cue mode", () => {
    expect(cuesToCaptions(cues, "cue")).toHaveLength(1);
  });

  it("prefixes a leading space so caption renderers can place the gap", () => {
    expect(
      parseSubtitlesToCaptions("1\n00:00:00,000 --> 00:00:01,000\nhi\n").every(
        (caption) => caption.text.startsWith(" "),
      ),
    ).toBe(true);
  });
});

describe("path-morph", () => {
  it("returns the endpoints untouched at 0 and 1", () => {
    const pair = prepareMorph(MORPH_SHAPES.circle, MORPH_SHAPES.square);
    expect(morphBetween(0, MORPH_SHAPES.circle, MORPH_SHAPES.square)).toBe(pair.from);
    expect(morphBetween(1, MORPH_SHAPES.circle, MORPH_SHAPES.square)).toBe(pair.to);
  });

  it("clamps out-of-range progress instead of extrapolating geometry", () => {
    const from = MORPH_SHAPES.circle;
    const to = MORPH_SHAPES.triangle;
    expect(morphBetween(-2, from, to)).toBe(morphBetween(0, from, to));
    expect(morphBetween(4, from, to)).toBe(morphBetween(1, from, to));
  });

  it("keeps the intermediate shape inside the union of the two boxes", () => {
    // The visible symptom of a bad morph is a shape that flies off frame
    // halfway through, so the midpoint is bounded rather than eyeballed.
    const mid = morphBetween(0.5, MORPH_SHAPES.circle, MORPH_SHAPES.diamond);
    const box = getBoundingBox(mid);
    expect(box.x1).toBeGreaterThanOrEqual(-1);
    expect(box.y1).toBeGreaterThanOrEqual(-1);
    expect(box.x2).toBeLessThanOrEqual(101);
    expect(box.y2).toBeLessThanOrEqual(101);
  });

  it("fits a path to a box regardless of where it was authored", () => {
    const far = "M 900 900 L 940 900 L 940 940 L 900 940 Z";
    const box = getBoundingBox(fitToBox(far, { width: 1, height: 1 }));
    expect(box.x1).toBeCloseTo(0, 5);
    expect(box.y1).toBeCloseTo(0, 5);
    expect(box.x2).toBeCloseTo(1, 5);
    expect(box.y2).toBeCloseTo(1, 5);
  });

  it("walks a sequence and lands on the last shape at 1", () => {
    const pairs = prepareMorphSequence([
      MORPH_SHAPES.circle,
      MORPH_SHAPES.square,
      MORPH_SHAPES.triangle,
    ]);
    expect(pairs).toHaveLength(2);
    expect(morphSequence(0, pairs)).toBe(pairs[0].from);
    expect(morphSequence(1, pairs)).toBe(pairs[1].to);
    expect(morphSequence(0.5, pairs)).toBe(pairs[1].from);
  });

  it("closes the ring when looping so the wrap has no seam", () => {
    const pairs = prepareMorphSequence(
      [MORPH_SHAPES.circle, MORPH_SHAPES.blob],
      { loop: true },
    );
    expect(pairs).toHaveLength(2);
    expect(morphSequence(1, pairs)).toBe(pairs[0].from);
  });

  it("returns nothing for a chain too short to morph", () => {
    expect(prepareMorphSequence([MORPH_SHAPES.circle])).toEqual([]);
    expect(morphSequence(0.5, [])).toBe("");
  });
});

describe("displacement core", () => {
  it("is exactly zero at rest, in both directions", () => {
    // The displace contract: a presentation stays mounted for the whole life of
    // its sequence with progress pinned at 0, so a non-zero effect at
    // displace === 0 is applied to every frame the scene is on screen.
    expect(displacementIntensity(0, "peak")).toBe(0);
    expect(displacementIntensity(1, "peak")).toBe(0);
    expect(displacementIntensity(0, "ramp-in")).toBe(0);
    expect(displacementIntensity(1, "ramp-out")).toBe(0);

    const rest = displacementFrame(0, 1920, { scale: 120, blur: 20 });
    expect(rest.scale).toBe(0);
    expect(rest.blur).toBe(0);
    expect(rest.overscan).toBeCloseTo(1 + 4 / 1920, 6);
  });

  it("peaks in the middle of the cut", () => {
    expect(displacementIntensity(0.5, "peak")).toBeCloseTo(1, 6);
    expect(displacementFrame(0.5, 1920, { scale: 100 }).scale).toBeCloseTo(100, 6);
  });

  it("never produces NaN from an explicitly undefined option", () => {
    // Spreading a partially-filled config is the trap this guards: `undefined *
    // n` is NaN, and SVG drops a NaN attribute silently rather than erroring.
    const state = displacementFrame(0.4, 1920, {
      scale: undefined,
      blur: undefined,
      seed: undefined,
      churn: undefined,
      profile: undefined,
    });
    for (const value of [state.scale, state.blur, state.seed, state.overscan]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("derives the turbulence seed from displace, not from the frame number", () => {
    const a = displacementFrame(0.5, 1920, { seed: 7, churn: 6 });
    const b = displacementFrame(0.5, 1920, { seed: 7, churn: 6 });
    expect(a.seed).toBe(b.seed);
    expect(displacementFrame(1, 1920, { seed: 7, churn: 6 }).seed).toBe(13);
  });

  it("covers the frame corners when the mask is complete", () => {
    const complete = maskFrame(0, { width: 1920, height: 1080 });
    expect(complete.isComplete).toBe(true);
    expect(complete.size).toBeGreaterThan(Math.hypot(1920, 1080));

    const closed = maskFrame(1, { width: 1920, height: 1080 });
    expect(closed.size).toBe(0);
    expect(closed.isComplete).toBe(false);
  });

  it("prepares the mask morph in a unit box so per-frame work stays cheap", () => {
    const pair = prepareMaskMorph({ from: "circle", to: "square" });
    for (const d of [pair.from, pair.to]) {
      const box = getBoundingBox(d);
      expect(box.x2 - box.x1).toBeCloseTo(1, 5);
      expect(box.y2 - box.y1).toBeCloseTo(1, 5);
    }
  });
});
