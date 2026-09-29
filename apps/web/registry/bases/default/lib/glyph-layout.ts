/**
 * Measured glyph layout: every character's x, every line's width, from real
 * text metrics — so per-character animation can move glyphs without ever
 * letting them overlap or break a word across a line.
 *
 * The measurer is injected. In a render it is `measureText` from
 * `@remotion/layout-utils`; in a test it can be a fixed-advance function.
 * Positions come from measured *prefixes* of each word ("W", "Wo", "Wor"…)
 * rather than from summing single letters, so kerning pairs survive.
 */

/** Width in pixels of `text` set at `fontSize`. */
export type MeasureFn = (text: string, fontSize: number) => number;

export type GlyphBox = {
  char: string;
  /** Document order across the whole block. */
  index: number;
  lineIndex: number;
  /** Word ordinal across the whole block. */
  wordIndex: number;
  /** Left edge within the line, before alignment. */
  x: number;
  width: number;
};

export type WordBox = {
  index: number;
  lineIndex: number;
  x: number;
  width: number;
  glyphs: GlyphBox[];
};

export type LineBox = {
  index: number;
  /** Top of the line box. */
  y: number;
  width: number;
  words: WordBox[];
  glyphs: GlyphBox[];
};

export type GlyphLayout = {
  fontSize: number;
  lineHeightPx: number;
  /** Widest line — the stable width of the block. */
  width: number;
  height: number;
  lines: LineBox[];
  glyphs: GlyphBox[];
};

export type GlyphLayoutOptions = {
  text: string;
  fontSize: number;
  /** Lines wrap at this width; a single word wider than it shrinks the type. */
  maxWidth: number;
  /** Extra space after every glyph, in em. */
  letterSpacing?: number;
  /** Line height as a multiple of the font size. */
  lineHeight?: number;
  minFontSize?: number;
  measure: MeasureFn;
};

function wordWidth(word: string, size: number, spacing: number, measure: MeasureFn): number {
  return measure(word, size) + Array.from(word).length * spacing;
}

/**
 * Greedy wrap within `maxWidth`. Explicit `\n` always breaks; a word is never
 * split. Returns lines as arrays of words.
 */
function wrap(
  paragraphs: string[][],
  size: number,
  spacing: number,
  maxWidth: number,
  measure: MeasureFn,
): string[][] {
  const space = measure(" ", size) + spacing;
  const lines: string[][] = [];
  for (const words of paragraphs) {
    let current: string[] = [];
    let width = 0;
    for (const word of words) {
      const w = wordWidth(word, size, spacing, measure);
      const next = current.length === 0 ? w : width + space + w;
      if (current.length > 0 && next > maxWidth) {
        lines.push(current);
        current = [word];
        width = w;
      } else {
        current.push(word);
        width = next;
      }
    }
    lines.push(current);
  }
  return lines;
}

export function layoutGlyphs({
  text,
  fontSize,
  maxWidth,
  letterSpacing = 0,
  lineHeight = 1.1,
  minFontSize = 12,
  measure,
}: GlyphLayoutOptions): GlyphLayout {
  if (!(fontSize > 0) || !(maxWidth > 0)) {
    throw new Error("glyph-layout: fontSize and maxWidth must be positive numbers.");
  }
  const paragraphs = text.split(/\r?\n/).map((line) => line.split(/\s+/).filter(Boolean));

  // Shrink only when a single word cannot fit: wrapping handles the rest.
  const longest = Math.max(
    0,
    ...paragraphs.flat().map((word) => wordWidth(word, fontSize, letterSpacing * fontSize, measure)),
  );
  const size =
    longest > maxWidth ? Math.max(minFontSize, (fontSize * maxWidth) / longest) : fontSize;
  const spacing = letterSpacing * size;
  const space = measure(" ", size) + spacing;
  const lineHeightPx = size * lineHeight;

  const glyphs: GlyphBox[] = [];
  let wordIndex = 0;
  const lines = wrap(paragraphs, size, spacing, maxWidth, measure).map<LineBox>((words, lineIndex) => {
    let cursor = 0;
    const lineGlyphs: GlyphBox[] = [];
    const wordBoxes = words.map<WordBox>((word, i) => {
      if (i > 0) cursor += space;
      const chars = Array.from(word);
      const prefix = chars.map((_, k) => measure(chars.slice(0, k + 1).join(""), size) + (k + 1) * spacing);
      const wordGlyphs = chars.map<GlyphBox>((char, k) => {
        const left = k === 0 ? 0 : prefix[k - 1];
        const box = {
          char,
          index: glyphs.length,
          lineIndex,
          wordIndex,
          x: cursor + left,
          width: prefix[k] - left,
        };
        glyphs.push(box);
        return box;
      });
      const box = { index: wordIndex, lineIndex, x: cursor, width: prefix[prefix.length - 1] ?? 0, glyphs: wordGlyphs };
      cursor += box.width;
      wordIndex += 1;
      lineGlyphs.push(...wordGlyphs);
      return box;
    });
    return { index: lineIndex, y: lineIndex * lineHeightPx, width: cursor, words: wordBoxes, glyphs: lineGlyphs };
  });

  return {
    fontSize: size,
    lineHeightPx,
    width: Math.max(0, ...lines.map((line) => line.width)),
    height: lines.length * lineHeightPx,
    lines,
    glyphs,
  };
}

/** A stretch of consecutive glyphs on one line that can be drawn as plain text. */
export type GlyphRun = {
  lineIndex: number;
  /** First glyph index in the run. */
  start: number;
  /** One past the last glyph index. */
  end: number;
  /** The run's text, with one space at each word gap it crosses. */
  text: string;
};

/**
 * Group glyphs that need no individual treatment into runs, so a renderer
 * can draw each run as one text span instead of one transformed element per
 * glyph.
 *
 * Runs stop at word gaps by default. Inside a word, glyph x comes from the
 * browser's own measurement of that word's prefixes, so a run and a lone
 * glyph land on the same pixels and a glyph can leave or rejoin a run without
 * moving. Across a line, word-gap measurements each round to Chrome's 1/64px
 * layout unit and drift up to ~0.75px by the line end — so `crossWords` is
 * opt-in, for text that never switches glyphs between the two paths.
 */
export function plainRuns(
  layout: GlyphLayout,
  isPlain: (index: number) => boolean,
  { crossWords = false }: { crossWords?: boolean } = {},
): GlyphRun[] {
  const runs: GlyphRun[] = [];
  for (const line of layout.lines) {
    /** Index in `runs` of the run still accepting glyphs, or -1. */
    let open = -1;
    let previousWord = -1;
    for (const glyph of line.glyphs) {
      if (!isPlain(glyph.index)) {
        open = -1;
        continue;
      }
      const run = open === -1 ? undefined : runs[open];
      const sameWord = glyph.wordIndex === previousWord;
      if (run && run.end === glyph.index && (crossWords || sameWord)) {
        const gap = glyph.wordIndex !== previousWord ? " " : "";
        runs[open] = { ...run, end: glyph.index + 1, text: run.text + gap + glyph.char };
      } else {
        runs.push({ lineIndex: line.index, start: glyph.index, end: glyph.index + 1, text: glyph.char });
        open = runs.length - 1;
      }
      previousWord = glyph.wordIndex;
    }
  }
  return runs;
}
