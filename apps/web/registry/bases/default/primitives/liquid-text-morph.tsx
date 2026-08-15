import { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { splitText, type SplitUnitState } from "@/remotion/lib/text-split";
import { SplitTextChars } from "@/remotion/primitives/split-text-chars";

export type LiquidTextMorphProps = {
  /** Two or more words. The last morphs back into the first when looping. */
  words: string[];
  /** Frames a word is held before it starts melting. */
  holdInFrames?: number;
  /** Frames one word takes to become the next. */
  morphInFrames?: number;
  /** Keep cycling. When false the last word is held forever. */
  loop?: boolean;
  /** Blur feeding the threshold, in em. This is what makes letters merge. */
  gooStrength?: number;
  /** Alpha contrast on the blurred layer. Lower is softer and wetter. */
  gooContrast?: number;
  /** Frames between neighbouring letters melting. Clamped to fit the morph. */
  staggerInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: string;
};

/**
 * Melts one word into the next.
 *
 * The morph is a gooey-filter trick, not path interpolation: both words are
 * drawn at once inside an SVG blur-plus-alpha-threshold, so letterforms that
 * come near each other fuse into one blob and split apart again. Real glyph
 * outline interpolation needs matched node counts between two arbitrary letters
 * — `A` and `s` do not have them — and produces tearing where this produces
 * surface tension. Use `shape-morph` when the two shapes are paths you control.
 *
 * Both words run through `split-text-chars`, the outgoing one on a reversed
 * clock, so a letter leaves exactly the way its replacement arrives.
 */
export const LiquidTextMorph: React.FC<LiquidTextMorphProps> = ({
  words,
  holdInFrames = 12,
  morphInFrames = 22,
  loop = true,
  gooStrength = 0.045,
  gooContrast = 18,
  staggerInFrames = 2,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 700,
  fontFamily,
  letterSpacing,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  // `useId()` returns colons, which are legal in an id but awkward inside a
  // `url(#...)` reference — strip them rather than debug it later.
  const filterId = `goo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fontSize = fontSizeProp ?? scaleFont(96, width);

  const safeWords = words.length > 0 ? words : [""];
  const hold = Math.max(0, Math.round(holdInFrames));
  const morph = Math.max(1, Math.round(morphInFrames));
  const cycle = hold + morph;

  const step = Math.floor(frame / cycle);
  const local = frame - step * cycle;
  const lastStep = safeWords.length - 1;
  const index = loop ? step % safeWords.length : Math.min(step, lastStep);
  const nextIndex = loop
    ? (index + 1) % safeWords.length
    : Math.min(index + 1, lastStep);

  const outgoing = safeWords[index];
  const incoming = safeWords[nextIndex];
  const morphing = local >= hold && (loop || step < lastStep);
  // The melt clock. Both layers read it, one of them backwards.
  const m = morphing ? local - hold : 0;

  // A stagger wide enough to overflow the morph would leave the last letter
  // half-formed when the hold starts, so it is fitted to the longest word.
  const longest = Math.max(
    splitText(outgoing).total,
    splitText(incoming).total,
    1,
  );
  const stagger = Math.min(staggerInFrames, (morph * 0.4) / Math.max(1, longest - 1));
  const unitDuration = Math.max(3, morph - stagger * (longest - 1));

  const blur = gooStrength * fontSize;

  const liquidUnit = (unit: SplitUnitState) => (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: unit.opacity,
        // Letters arrive squat and wide and tighten up, which is what reads as
        // surface tension once the threshold has fused them. The range is
        // deliberately shallow: squashing a glyph to a quarter height turns the
        // mid-morph frame into an unreadable puddle rather than two words
        // trading places.
        scale: `${(0.78 + unit.value * 0.22).toFixed(4)} ${(0.5 + unit.value * 0.5).toFixed(4)}`,
        transformOrigin: "center center",
      }}
    >
      {unit.text}
    </span>
  );

  const layer = (text: string, clock: number, key: string) => (
    <span key={key} style={{ gridArea: "1 / 1", justifySelf: "center" }}>
      <SplitTextChars
        text={text}
        frame={clock}
        mode="chars"
        effect="none"
        renderUnit={liquidUnit}
        staggerInFrames={stagger}
        durationInFrames={unitDuration}
        fontSize={fontSize}
        color={color}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
        letterSpacing={letterSpacing}
      />
    </span>
  );

  return (
    <span style={{ display: "inline-block", position: "relative" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="wet" />
            {/* Alpha contrast: pushes the blurred edges back to a hard edge, so
                two blurred glyphs that overlap read as one fused shape. */}
            <feColorMatrix
              in="wet"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${gooContrast} ${(-gooContrast / 2).toFixed(2)}`}
            />
          </filter>
        </defs>
      </svg>
      <span
        style={{
          display: "grid",
          placeItems: "center",
          filter: `url(#${filterId})`,
        }}
      >
        {/* The outgoing word plays its own entrance backwards, on a clock that
            runs 1.5× fast, and the incoming one does not start until the melt
            is 30% through. Running both across the whole morph leaves two full
            words stacked at the midpoint, and the threshold fuses them into an
            unreadable puddle — the overlap has to be a third of the morph, not
            all of it. */}
        {layer(outgoing, morphing ? Math.max(0, morph - m * 1.5) : morph, `out-${index}`)}
        {morphing
          ? layer(incoming, Math.max(0, (m - morph * 0.3) * 1.45), `in-${nextIndex}`)
          : null}
      </span>
    </span>
  );
};
