import type { TikTokPage } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  getAbsoluteTimeMs,
  getTokenEmphasis,
  isTokenActive,
} from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";

export type CaptionHighlightProps = {
  page: TikTokPage;
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  /** Scale multiplier for the active word. 1 keeps color-only behavior. */
  activeScale?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const CaptionHighlight: React.FC<CaptionHighlightProps> = ({
  page,
  activeColor = "#e8b86d",
  inactiveColor = "#fafafa",
  fontSize: fontSizeProp,
  fontWeight = 700,
  activeScale = 1.08,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        textAlign: "center",
        lineHeight: 1.2,
        whiteSpace: "pre",
        color: inactiveColor,
        textShadow: "0 2px 18px rgba(0, 0, 0, 0.72)",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        const scale = activeScale > 1 ? 1 + emphasis * (activeScale - 1) : 1;
        const glow = active ? 0.35 + emphasis * 0.25 : 0;

        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color: active ? activeColor : inactiveColor,
              display: "inline-block",
              transform: `scale(${scale})`,
              transformOrigin: "center bottom",
              textShadow:
                glow > 0
                  ? `0 0 ${Math.round(18 * glow)}px ${activeColor}88, 0 2px 18px rgba(0, 0, 0, 0.72)`
                  : undefined,
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
