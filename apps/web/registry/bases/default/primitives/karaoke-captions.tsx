import type { TikTokPage } from "@remotion/captions";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  getAbsoluteTimeMs,
  getTokenEmphasis,
  isTokenActive,
} from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type KaraokeCaptionMode = "scale" | "underline";

export type KaraokeCaptionsProps = {
  page: TikTokPage;
  activeColor?: string;
  completedColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  mode?: KaraokeCaptionMode;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
  page,
  activeColor = "#ff6b00",
  completedColor = "#111111",
  inactiveColor = "rgba(17, 17, 17, 0.32)",
  fontSize: fontSizeProp,
  fontWeight = 800,
  mode = "underline",
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
        lineHeight: 1.08,
        textAlign: "center",
        whiteSpace: "pre-wrap",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const completed = token.toMs <= absoluteTimeMs;
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        const durationMs = Math.max(1, token.toMs - token.fromMs);
        const activeProgress = active
          ? clamp01((absoluteTimeMs - token.fromMs) / durationMs)
          : completed
            ? 1
            : 0;
        const progress = interpolate(activeProgress, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.enter,
        });
        const color = active
          ? activeColor
          : completed
            ? completedColor
            : inactiveColor;

        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color,
              display: "inline-block",
              position: "relative",
              // `scale` shorthand keeps the keyframe editable in Remotion Studio.
              scale:
                mode === "scale"
                  ? interpolate(emphasis, [0, 1], [1, 1.06], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: EASING.enter,
                    })
                  : 1,
              transformOrigin: "center bottom",
            }}
          >
            {token.text}
            {mode === "underline" && active ? (
              <span
                style={{
                  position: "absolute",
                  right: "0.08em",
                  bottom: "-0.1em",
                  left: "0.08em",
                  height: "0.08em",
                  overflow: "hidden",
                  borderRadius: 999,
                  background: "rgba(17, 17, 17, 0.12)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: `${progress * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: activeColor,
                  }}
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};
