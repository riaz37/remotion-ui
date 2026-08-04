import type { TikTokPage } from "@remotion/captions";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  getAbsoluteTimeMs,
  getTokenEmphasis,
  isTokenActive,
} from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type CaptionHighlightProps = {
  page: TikTokPage;
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  activeWeight?: number | string;
  textAlign?: "left" | "center";
  lineHeight?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const CaptionHighlight: React.FC<CaptionHighlightProps> = ({
  page,
  activeColor = "#ff6b00",
  inactiveColor = "#111111",
  fontSize: fontSizeProp,
  fontWeight = 650,
  activeWeight = 800,
  textAlign = "center",
  lineHeight = 1.12,
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
        lineHeight,
        textAlign,
        whiteSpace: "pre-wrap",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        const activeOpacity = interpolate(emphasis, [0, 1], [0.72, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.enter,
        });

        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color: active ? activeColor : inactiveColor,
              fontWeight: active ? activeWeight : fontWeight,
              opacity: active ? activeOpacity : 0.82,
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
