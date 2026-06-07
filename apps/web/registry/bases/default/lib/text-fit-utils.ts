export type FitHeadlineOptions = {
  text: string;
  maxWidth: number;
  maxFontSize: number;
  minFontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fallbackWidth?: number;
};

export function fitHeadline({
  text,
  maxWidth,
  maxFontSize,
  minFontSize = 32,
}: FitHeadlineOptions): number {
  const longestLine = text
    .split(/\s+/)
    .reduce((longest, word) => Math.max(longest, word.length), 1);
  const estimatedCharacters = Math.max(longestLine, text.length * 0.56);
  const estimatedSize = maxWidth / Math.max(1, estimatedCharacters * 0.56);

  return Math.round(Math.max(minFontSize, Math.min(maxFontSize, estimatedSize)));
}
