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
  /** Tilt of the stroke in degrees — a hand does not draw level. */
  tilt?: number;
  color?: string;
  markerColor?: string;
  /** Ink over a covered word. Defaults on for `knockout`. */
  invertOnHighlight?: boolean;
  inkColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  style?: React.CSSProperties;
};

const WORD_GAP = "0.28em";

/** Band opacity per variant — a real marker is translucent, a knockout is not. */
const BAND_OPACITY: Record<MarkerVariant, number> = {
  marker: 0.42,
  knockout: 1,
  underline: 1,
  box: 1,
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Strikes emphasis across a phrase, word by word.
 *
 * Word by word matters: one band appearing behind the whole phrase reads as a
 * background, while a stroke that crosses each word in turn reads as a hand
 * moving. The ink flips under the leading edge of the stroke rather than at a
 * threshold, so the covered text is never briefly unreadable.
 */
export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({
  text,
  phrase,
  highlightWord,
  variant = "marker",
  durationInFrames = 12,
  delayInFrames = 0,
  staggerInFrames = 4,
  tilt = -0.7,
  color = "#f8fafc",
  markerColor = "#fbbf24",
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
  const overhang = fontSize * 0.07;

  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `0.14em ${WORD_GAP}`,
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
        const edges = markerEdges(words, index, WORD_GAP, overhang, overhang);
        const band = bandBox(variant);

        return (
          <span
            key={`w-${index}`}
            style={{ position: "relative", whiteSpace: "nowrap" }}
          >
            <span
              style={{
                position: "absolute",
                left: edges.left,
                right: edges.right,
                ...band,
                background: markerColor,
                opacity: BAND_OPACITY[variant],
                ...(variant === "box"
                  ? {
                      background: "transparent",
                      border: `${Math.max(2, fontSize * 0.035)}px solid ${markerColor}`,
                    }
                  : {}),
                borderTopLeftRadius: edges.borderTopLeftRadius,
                borderBottomLeftRadius: edges.borderBottomLeftRadius,
                borderTopRightRadius: edges.borderTopRightRadius,
                borderBottomRightRadius: edges.borderBottomRightRadius,
                transformOrigin: "left center",
                transform: `rotate(${tilt}deg) scaleX(${sweep})`,
              }}
            />
            <span style={{ position: "relative" }}>{word.text}</span>
            {inverts ? (
              /* Same glyphs in the inverted ink, revealed exactly under the
               * leading edge of the stroke. */
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: inkColor,
                  clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`,
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

/** Vertical extent of the stroke for each variant. */
function bandBox(variant: MarkerVariant): React.CSSProperties {
  if (variant === "underline") {
    return { bottom: "-0.02em", height: "0.12em" };
  }
  if (variant === "box") {
    return { top: "-0.06em", bottom: "-0.02em" };
  }
  return { top: "0.08em", bottom: "0.04em" };
}
