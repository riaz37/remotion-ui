import type { CSSProperties, ReactNode } from "react";
import { useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  useSplitText,
  type SplitMode,
  type SplitOrder,
  type SplitTimingOptions,
  type SplitUnitState,
} from "@/remotion/lib/text-split";

/**
 * Splits a string into characters, words or lines and staggers them in.
 *
 * The default look is deliberately plain. This component's job is to be the
 * thing every other text effect is built on: it owns the split, the layout and
 * the stagger, and hands each unit's 0-1 progress to `renderUnit` so an effect
 * only has to describe one glyph. Effects that draw something other than a
 * `<span>` of text should skip the component and call `useSplitText()` instead.
 */

export type SplitTextEffect = "fade-up" | "fade" | "scale" | "blur" | "none";

export type SplitTextCharsProps = Omit<SplitTimingOptions, "mode"> & {
  text: string;
  /** What one unit is. `words` absorbs a word-by-word reveal. */
  mode?: SplitMode;
  order?: SplitOrder;
  /** Built-in look. `none` positions the units and animates nothing. */
  effect?: SplitTextEffect;
  /**
   * Draws one unit. Receives the unit's own progress, already staggered.
   * The returned node is placed inside a positioned inline-block, so it only
   * needs to describe appearance.
   */
  renderUnit?: (unit: SplitUnitState) => ReactNode;
  /** Travel distance of `fade-up`, in em. */
  travel?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: string;
  textAlign?: CSSProperties["textAlign"];
  /** Gap between words, in em. Chars mode needs the space to be real layout. */
  wordSpacing?: number;
  style?: CSSProperties;
  className?: string;
};

function unitStyle(
  effect: SplitTextEffect,
  unit: SplitUnitState,
  travel: number,
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    // A collapsed empty unit would drop out of the line box and shift the
    // baseline of everything after it.
    whiteSpace: "pre",
    willChange: "transform, opacity",
  };

  if (effect === "none") {
    return base;
  }

  if (effect === "fade") {
    return { ...base, opacity: unit.opacity };
  }

  if (effect === "scale") {
    return {
      ...base,
      opacity: unit.opacity,
      scale: 0.72 + unit.value * 0.28,
      transformOrigin: "center bottom",
    };
  }

  if (effect === "blur") {
    const blur = unit.displace * 8;
    return {
      ...base,
      opacity: unit.opacity,
      filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined,
    };
  }

  return {
    ...base,
    opacity: unit.opacity,
    translate: `0 ${(unit.displace * travel).toFixed(4)}em`,
  };
}

export const SplitTextChars: React.FC<SplitTextCharsProps> = ({
  text,
  mode = "chars",
  order = "start",
  effect = "fade-up",
  renderUnit,
  travel = 0.42,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
  lineHeight = 1.15,
  letterSpacing,
  textAlign = "center",
  wordSpacing = 0.26,
  style,
  className,
  ...timing
}) => {
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const { lines } = useSplitText({ text, mode, order, ...timing });

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems:
          textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center",
        fontSize,
        fontWeight,
        color,
        lineHeight,
        letterSpacing,
        textAlign,
        ...(fontFamily ? { fontFamily } : {}),
        ...style,
      }}
    >
      {lines.map((line) => (
        <span
          key={line.index}
          style={{
            display: "block",
            // Words wrap; the characters inside one never do, because each word
            // is its own inline-block.
            whiteSpace: "normal",
          }}
        >
          {line.words.map((word, wordIndex) => (
            <span
              key={word.index}
              style={{
                display: "inline-block",
                marginRight:
                  wordIndex === line.words.length - 1 ? 0 : `${wordSpacing}em`,
              }}
            >
              {word.units.map((unit) => (
                <span
                  key={`${unit.index}-${unit.text}`}
                  style={unitStyle(effect, unit, travel)}
                >
                  {renderUnit ? renderUnit(unit) : unit.text}
                </span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
};
