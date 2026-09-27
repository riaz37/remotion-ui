import type { TikTokPage } from "@remotion/captions";
import { Fragment } from "react";
import {
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  getAbsoluteTimeMs,
  getTokenEmphasis,
} from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING, EMPHASIS } from "@/remotion/lib/motion-tokens";

export type CaptionHighlightProps = {
  page: TikTokPage;
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  activeWeight?: number | string;
  textAlign?: "left" | "center";
  lineHeight?: number;
  /** Peak scale of the active word. Defaults to `EMPHASIS.subtle`. */
  emphasisScale?: number;
  /**
   * Drop shadow behind every word, tuned for light text over busy real
   * footage. Set `false` to render flat when the caller already controls
   * contrast (a solid background, an overlay scrim).
   */
  shadow?: boolean;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

/** Legible over live-action video without flattening the text like a stroke would. */
const READABILITY_SHADOW =
  "0 1px 2px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.45)";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Caption tokens carry their own leading space. It has to sit outside the
 * scaled box — a word that grows inside its own space closes the gap to the
 * word before it.
 */
function splitLeadingSpace(text: string) {
  const leading = /^\s+/.exec(text)?.[0] ?? "";
  return { leading, word: text.slice(leading.length) };
}

export const CaptionHighlight: React.FC<CaptionHighlightProps> = ({
  page,
  activeColor = "#ff6b00",
  inactiveColor = "#111111",
  fontSize: fontSizeProp,
  fontWeight = 650,
  activeWeight = 800,
  textAlign = "center",
  lineHeight = 1.12,
  emphasisScale = EMPHASIS.subtle,
  shadow = true,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(64, width);
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);

  return (
    <div
      style={{
        color: inactiveColor,
        fontSize,
        fontWeight,
        letterSpacing: 0,
        // The active word grows into the gaps on both sides, so the resting
        // rhythm has to be wider than a bare space character.
        wordSpacing: "0.12em",
        lineHeight,
        textAlign,
        whiteSpace: "pre-wrap",
        textShadow: shadow ? READABILITY_SHADOW : undefined,
      }}
    >
      {page.tokens.map((token) => {
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        // One ramp drives colour, weight, size and opacity — the word is
        // emphasised as a single gesture rather than a colour swap.
        const color = interpolateColors(
          emphasis,
          [0, 1],
          [inactiveColor, activeColor],
        );
        const scale = interpolate(emphasis, [0, 1], [1, emphasisScale], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.pop,
          output: "perceptual-scale",
        });
        const opacity = interpolate(emphasis, [0, 1], [0.78, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.enter,
        });

        const { leading, word } = splitLeadingSpace(token.text);

        return (
          <Fragment key={`${token.fromMs}-${token.text}`}>
            {leading}
            <span
              style={{
                color,
                // Weight is a step, not a ramp — half-bold reads as a render bug.
                fontWeight: emphasis > 0.5 ? activeWeight : fontWeight,
                opacity,
                display: "inline-block",
                scale,
                translate: `0 ${(-0.025 * emphasis).toFixed(4)}em`,
                transformOrigin: "center bottom",
              }}
            >
              {word}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
};
