/**
 * Word-level emphasis matching for scenes that sweep a marker across a phrase.
 *
 * Splitting to words — rather than wrapping the phrase in one span — keeps the
 * marker tracking the text once the line wraps, and lets each word be swept in
 * turn so the highlight reads as a stroke instead of a block appearing at once.
 */

export type EmphasisWord = {
  /** The word as it appears in the source string. */
  text: string;
  /** True when the word falls inside the emphasised phrase. */
  marked: boolean;
  /** Index of this word among the marked ones, for staggering. Otherwise -1. */
  order: number;
};

/**
 * Splits `text` into words, flagging the ones covered by `phrase`.
 * Matching is case-insensitive; an absent or unmatched phrase marks nothing.
 */
export function markEmphasis(text: string, phrase?: string): EmphasisWord[] {
  const words = text.split(/\s+/).filter(Boolean);
  const plain = () =>
    words.map((word) => ({ text: word, marked: false, order: -1 }));

  if (!phrase || !phrase.trim()) return plain();

  const needle = phrase.trim().toLowerCase();
  const start = text.toLowerCase().indexOf(needle);
  if (start < 0) return plain();

  const end = start + needle.length;
  let cursor = 0;
  let order = 0;

  return words.map((word) => {
    const at = text.indexOf(word, cursor);
    cursor = at + word.length;
    const marked = at < end && cursor > start;
    return { text: word, marked, order: marked ? order++ : -1 };
  });
}

/**
 * Rounded corners and insets for a marker behind `words[index]`, bridging the
 * space to a neighbouring marked word so a phrase reads as one stroke.
 */
export function markerEdges(
  words: EmphasisWord[],
  index: number,
  gap: string,
  overhang = 5,
  radius = 5,
): {
  left: number;
  right: number | string;
  borderTopLeftRadius: number;
  borderBottomLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
} {
  const joinsLeft = index > 0 && words[index - 1].marked;
  const joinsRight = Boolean(words[index + 1]?.marked);

  return {
    left: joinsLeft ? 0 : -overhang,
    right: joinsRight ? `-${gap}` : -overhang,
    borderTopLeftRadius: joinsLeft ? 0 : radius,
    borderBottomLeftRadius: joinsLeft ? 0 : radius,
    borderTopRightRadius: joinsRight ? 0 : radius,
    borderBottomRightRadius: joinsRight ? 0 : radius,
  };
}
