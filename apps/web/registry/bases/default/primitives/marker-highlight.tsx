import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { markEmphasis, markerEdges } from "@/remotion/lib/text-emphasis";

export type MarkerVariant = "marker" | "knockout" | "underline" | "box";

export type MarkerHighlightProps = {
  text: string;
  /** Phrase to sweep. Matched case-insensitively, may span several words. */
  phrase?: string;
  /** Single-word form of `phrase`. */
  highlightWord?: string;
  /** How the emphasis is drawn. */
  variant?: MarkerVariant;
  /** Length of the sweep across one word. */
  durationInFrames?: number;
  delayInFrames?: number;
  /** Frames between one word being struck and the next. */
  staggerInFrames?: number;
  /** Angle of the nib in degrees off vertical — a hand does not hold it level. */
  tilt?: number;
  /** Softness of the leading edge, as a share of the word. 0 is a hard cut. */
  inkSoftness?: number;
  color?: string;
  markerColor?: string;
  /** Alpha of the ink. Defaults per variant. */
  markerOpacity?: number;
  /** Ink over a covered word. Defaults on for `knockout`. */
  invertOnHighlight?: boolean;
  inkColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  style?: React.CSSProperties;
};

/**
 * Gap between words. The flex gap is the whole inter-word advance, so a band
 * that bridges to its neighbour extends by exactly this much — joined words
 * abut with no overlap, and a translucent ink never doubles into a seam.
 */
const WORD_GAP = "0.26em";

type BandStyle = {
  /** Top edge and height in em, measured from the word's own line box. */
  top: number;
  height: number;
  /** Alpha of the ink. */
  opacity: number;
  /** Share of the height that fades out at the top and bottom edges. */
  feather: number;
  /** Depth of the fibre striations along the stroke. 0 is an even fill. */
  grain: number;
  /** Corner radius in em. */
  radius: number;
  /** Draw an outline instead of a fill. */
  outlined: boolean;
};

/**
 * Geometry is stated as `top` + `height` rather than `top` + `bottom` on
 * purpose: both are read from the word's own line box, which is the same on
 * every line, so a wrapped phrase carries one band height throughout. A band
 * pinned to both edges instead inherits the line's leading and drifts.
 *
 * The marker box is roughly cap height plus overshoot — a band as tall as the
 * full line box stops reading as a stroke and starts reading as a table cell.
 */
const BAND: Record<MarkerVariant, BandStyle> = {
  marker: {
    top: 0.19,
    height: 0.9,
    opacity: 0.62,
    feather: 0.08,
    grain: 0.1,
    radius: 0.12,
    outlined: false,
  },
  knockout: {
    top: 0.17,
    height: 0.9,
    opacity: 1,
    feather: 0.04,
    grain: 0.05,
    radius: 0.06,
    outlined: false,
  },
  underline: {
    top: 1.0,
    height: 0.14,
    opacity: 0.95,
    feather: 0.18,
    grain: 0.08,
    radius: 0.06,
    outlined: false,
  },
  box: {
    top: 0.11,
    height: 1.04,
    opacity: 1,
    feather: 0,
    grain: 0,
    radius: 0.07,
    outlined: true,
  },
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Deterministic ±1. A random value would resample on every render pass. */
function jitter(index: number, salt: number): number {
  const noise = Math.sin(index * 41.17 + salt * 27.31) * 43758.5453;
  return (noise - Math.floor(noise)) * 2 - 1;
}

/**
 * Strikes emphasis across a phrase, word by word.
 *
 * Word by word matters: one band appearing behind the whole phrase reads as a
 * background, while a stroke that crosses each word in turn reads as a hand
 * moving. The ink flips under the leading edge of the stroke rather than at a
 * threshold, so the covered text is never briefly unreadable.
 *
 * The stroke is built the way ink lands rather than as a filled rectangle:
 * feathered top and bottom edges, fibre striations running along the stroke,
 * and a soft leading edge held off vertical by `tilt`. The band itself is never
 * rotated — rotating each word's box is what turns a joined phrase into a
 * staircase of offset rectangles.
 *
 * Everything that varies is anchored to the band's own top edge, which is the
 * same on every line, so the striations and the feather run through a word join
 * without a seam and a wrapped phrase carries one continuous stroke.
 */
export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({
  text,
  phrase,
  highlightWord,
  variant = "marker",
  durationInFrames = 12,
  delayInFrames = 0,
  staggerInFrames = 4,
  tilt = -4,
  inkSoftness = 0.16,
  color = "#f8fafc",
  markerColor = "#fbbf24",
  markerOpacity,
  invertOnHighlight,
  inkColor = "#080810",
  fontSize: fontSizeProp,
  fontWeight = 600,
  fontFamily,
  textAlign = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const words = markEmphasis(text, phrase ?? highlightWord);
  const inverts = invertOnHighlight ?? variant === "knockout";
  const band = BAND[variant];
  const overhang = fontSize * 0.09;
  const opacity = markerOpacity ?? band.opacity;
  const soft = Math.max(0, inkSoftness) * 100;

  /* The nib is held off vertical, the way a chisel tip is. The long edges stay
   * level on purpose: a sloped gradient is measured against the box it is
   * painted in, so tilting them would move the top edge by a different amount
   * on a long word than on a short one and print a step at every join. */
  const nibAngle = 90 + tilt * 1.6;

  const feather = band.feather * 100;
  const featherMask =
    feather > 0
      ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.86) ${feather.toFixed(2)}%, rgba(0,0,0,1) ${(feather * 2.1).toFixed(2)}%, rgba(0,0,0,0.96) ${(100 - feather * 2.4).toFixed(2)}%, rgba(0,0,0,0.78) ${(100 - feather).toFixed(2)}%, rgba(0,0,0,0) 100%)`
      : "none";

  /* Striations run along the stroke, not across it. An across-the-stroke streak
   * would restart at every word and print a seam at each join; banding along
   * the stroke is measured from the band's top edge, which every word shares. */
  const fibre = fontSize * band.height * 0.17;
  const grainMask =
    band.grain > 0
      ? `repeating-linear-gradient(180deg, rgba(0,0,0,1) 0px, rgba(0,0,0,1) ${(fibre * 0.42).toFixed(2)}px, rgba(0,0,0,${(1 - band.grain).toFixed(3)}) ${(fibre * 0.62).toFixed(2)}px, rgba(0,0,0,${(1 - band.grain * 0.45).toFixed(3)}) ${(fibre * 0.78).toFixed(2)}px, rgba(0,0,0,1) ${fibre.toFixed(2)}px)`
      : "none";

  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        /* Baseline alignment, not the default stretch: a stretched flex item
         * takes the height of the tallest item on its own line, so the band
         * would change size line by line. */
        alignItems: "baseline",
        gap: `0.16em ${WORD_GAP}`,
        justifyContent:
          textAlign === "center"
            ? "center"
            : textAlign === "right"
              ? "flex-end"
              : "flex-start",
        color,
        fontSize,
        fontWeight,
        lineHeight: 1.3,
        ...(fontFamily !== undefined ? { fontFamily } : {}),
        ...style,
      }}
    >
      {words.map((word, index) => {
        if (!word.marked) {
          return <span key={`w-${index}`}>{word.text}</span>;
        }

        const start = delayInFrames + word.order * staggerInFrames;
        const sweep = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { easing: EASING.editorial, ...clamp },
        );
        const edges = markerEdges(
          words,
          index,
          WORD_GAP,
          overhang,
          band.radius * fontSize,
        );

        /* The nib runs one softness past the far edge, so the word is fully
         * inked at sweep 1 rather than trailing a permanent fade. Its angle
         * drifts per word — a hand does not re-present the tip identically —
         * which only shows while the word is being crossed. */
        const lead = sweep * (100 + soft);
        const nib = nibAngle + jitter(word.order, 3) * Math.abs(tilt);
        const inkMask = `linear-gradient(${nib.toFixed(2)}deg, rgba(0,0,0,1) ${(lead - soft).toFixed(2)}%, rgba(0,0,0,0) ${lead.toFixed(2)}%)`;

        /* The inverted glyphs turn where the ink is already at full strength,
         * at the back of the soft edge rather than at its middle. Fading them
         * in across the soft edge instead would put a half-tone letter on a
         * half-laid band, which is the one place the word is hard to read. */
        const flip = lead - soft;
        const flipMask = `linear-gradient(${nib.toFixed(2)}deg, rgba(0,0,0,1) ${(flip - 1.5).toFixed(2)}%, rgba(0,0,0,0) ${flip.toFixed(2)}%)`;

        /* A box is drawn per word like every other variant, so its inner
         * verticals have to go — otherwise a bridged phrase reads as one cell
         * per word instead of one rule around the phrase. */
        const joinsLeft = index > 0 && words[index - 1].marked;
        const joinsRight = Boolean(words[index + 1]?.marked);
        const outline = band.outlined
          ? {
              border: `${Math.max(2, fontSize * 0.035)}px solid ${markerColor}`,
              ...(joinsLeft ? { borderLeftWidth: 0 } : {}),
              ...(joinsRight ? { borderRightWidth: 0 } : {}),
            }
          : { background: markerColor };

        const corners = {
          borderTopLeftRadius: edges.borderTopLeftRadius,
          borderBottomLeftRadius: edges.borderBottomLeftRadius,
          borderTopRightRadius: edges.borderTopRightRadius,
          borderBottomRightRadius: edges.borderBottomRightRadius,
        };
        const box = {
          position: "absolute",
          left: edges.left,
          right: edges.right,
          top: `${band.top}em`,
          height: `${band.height}em`,
        } as const;

        return (
          <span
            key={`w-${index}`}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden
              style={{
                ...box,
                opacity,
                maskImage: inkMask,
                WebkitMaskImage: inkMask,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  maskImage: featherMask,
                  WebkitMaskImage: featherMask,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    maskImage: grainMask,
                    WebkitMaskImage: grainMask,
                    ...outline,
                    ...corners,
                  }}
                />
              </span>
            </span>
            <span style={{ position: "relative" }}>{word.text}</span>
            {inverts ? (
              /* Same glyphs in the inverted ink, cut by the nib rather than by
               * a threshold on the whole word — the letter turns exactly where
               * it is covered, and the base glyph stays underneath, so nothing
               * is ever unreadable in between. */
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: inkColor,
                  maskImage: flipMask,
                  WebkitMaskImage: flipMask,
                }}
              >
                {word.text}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
};
