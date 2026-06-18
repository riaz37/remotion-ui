import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, staggerDelay } from "@/remotion/lib/timing";

const MASK_LINE_HEIGHT = 1.12;

export type MaskedSlideRevealProps = {
  /** Single string — splits on newlines for line mode, or words when one line. */
  text?: string;
  /** Explicit lines to reveal; preferred for multi-line headlines. */
  lines?: string[];
  staggerInFrames?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineGap?: number;
};

function resolveLines(text: string | undefined, lines?: string[]): string[] {
  if (lines && lines.length > 0) {
    return lines;
  }

  const content = text?.trim() ?? "";
  if (!content) {
    return [];
  }

  if (content.includes("\n")) {
    return content.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  return content.split(/\s+/).filter(Boolean);
}

function isWordMode(text: string | undefined, lines?: string[]): boolean {
  const content = text?.trim() ?? "";
  return !lines?.length && Boolean(content) && !content.includes("\n");
}

export const MaskedSlideReveal: React.FC<MaskedSlideRevealProps> = ({
  text,
  lines,
  staggerInFrames = 6,
  durationInFrames = 16,
  delayInFrames = 0,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
  textAlign = "center",
  lineGap = 0.18,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const items = resolveLines(text, lines);
  const wordMode = isWordMode(text, lines);

  if (items.length === 0) {
    return null;
  }

  const typography = {
    fontSize,
    fontWeight,
    color,
    lineHeight: MASK_LINE_HEIGHT,
    letterSpacing: "-0.02em",
    ...(fontFamily ? { fontFamily } : {}),
  };

  const renderMaskedItem = (item: string, index: number) => {
    const start = staggerDelay(index, staggerInFrames, delayInFrames);
    const progress = interpolate(
      frame,
      [start, start + durationInFrames],
      [0, 1],
      {
        easing: EASING_ENTER,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
    const y = interpolate(progress, [0, 1], [108, 0]);

    return (
      <span
        key={`${item}-${index}`}
        style={{
          display: wordMode ? "inline-block" : "block",
          overflow: "hidden",
          height: `${MASK_LINE_HEIGHT}em`,
          lineHeight: MASK_LINE_HEIGHT,
          maxWidth: wordMode ? undefined : "100%",
        }}
      >
        <span
          style={{
            display: wordMode ? "inline-block" : "block",
            lineHeight: MASK_LINE_HEIGHT,
            translate: `0 ${y}%`,
            whiteSpace: wordMode ? "nowrap" : "pre-wrap",
          }}
        >
          {item}
        </span>
      </span>
    );
  };

  if (wordMode) {
    return (
      <span
        style={{
          ...typography,
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent:
            textAlign === "center"
              ? "center"
              : textAlign === "right"
                ? "flex-end"
                : "flex-start",
          gap: "0.28em",
          textAlign,
        }}
      >
        {items.map(renderMaskedItem)}
      </span>
    );
  }

  return (
    <span
      style={{
        ...typography,
        display: "flex",
        flexDirection: "column",
        alignItems:
          textAlign === "center"
            ? "center"
            : textAlign === "right"
              ? "flex-end"
              : "flex-start",
        gap: `${lineGap}em`,
        textAlign,
        width: "100%",
      }}
    >
      {items.map(renderMaskedItem)}
    </span>
  );
};
