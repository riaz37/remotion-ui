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
  isTokenActive,
} from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING, EMPHASIS } from "@/remotion/lib/motion-tokens";

export type KaraokeCaptionMode = "scale" | "underline";

export type KaraokeCaptionsProps = {
  page: TikTokPage;
  activeColor?: string;
  completedColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  mode?: KaraokeCaptionMode;
  /** Peak scale of the active word. Defaults to `EMPHASIS.subtle`. */
  emphasisScale?: number;
  /** Underline track behind the wipe. Defaults to `inactiveColor`. */
  trackColor?: string;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

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

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
  page,
  activeColor = "#ff6b00",
  completedColor = "#111111",
  inactiveColor = "rgba(17, 17, 17, 0.32)",
  fontSize: fontSizeProp,
  fontWeight = 800,
  mode = "underline",
  emphasisScale = EMPHASIS.subtle,
  trackColor,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(66, width);
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
        lineHeight: 1.18,
        textAlign: "center",
        whiteSpace: "pre-wrap",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const completed = token.toMs <= absoluteTimeMs;
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        const durationMs = Math.max(1, token.toMs - token.fromMs);
        const wipe = interpolate(
          active
            ? clamp01((absoluteTimeMs - token.fromMs) / durationMs)
            : completed
              ? 1
              : 0,
          [0, 1],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASING.enter,
          },
        );

        // Colour, size and lift all ride the same emphasis ramp, so a word
        // arrives as one gesture instead of recolouring a frame before it pops.
        const restColor = completed ? completedColor : inactiveColor;
        const color = interpolateColors(
          emphasis,
          [0, 1],
          [restColor, activeColor],
        );
        const scale = interpolate(emphasis, [0, 1], [1, emphasisScale], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.pop,
        });

        const { leading, word } = splitLeadingSpace(token.text);

        return (
          <Fragment key={`${token.fromMs}-${token.text}`}>
            {leading}
            <span
              style={{
                color,
                display: "inline-block",
                position: "relative",
                // `scale`/`translate` shorthands keep the keyframes editable in
                // Remotion Studio.
                scale,
                translate: `0 ${(-0.03 * emphasis).toFixed(4)}em`,
                transformOrigin: "center bottom",
              }}
            >
            {word}
            {mode === "underline" && emphasis > 0 ? (
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "-0.14em",
                  left: 0,
                  height: "0.075em",
                  overflow: "hidden",
                  borderRadius: 999,
                  background: trackColor ?? inactiveColor,
                  opacity: emphasis,
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: `${wipe * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: activeColor,
                  }}
                />
                </span>
              ) : null}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
};
