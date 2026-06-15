import type { TikTokPage } from "@remotion/captions";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  getAbsoluteTimeMs,
  isTokenActive,
} from "@/remotion/lib/caption-utils";

export type CaptionHighlightProps = {
  page: TikTokPage;
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  /** Scale multiplier for the active word. 1 keeps legacy color-only behavior. */
  activeScale?: number;
};

export const CaptionHighlight: React.FC<CaptionHighlightProps> = ({
  page,
  activeColor = "#fbbf24",
  inactiveColor = "#f8fafc",
  fontSize: fontSizeProp,
  fontWeight = "bold",
  activeScale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        whiteSpace: "pre",
        textAlign: "center",
        lineHeight: 1.25,
        textShadow: "0 2px 16px rgba(0, 0, 0, 0.65)",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const scale =
          active && activeScale > 1
            ? spring({
                frame,
                fps,
                config: { damping: 18, stiffness: 220 },
              }) *
                (activeScale - 1) +
              1
            : 1;

        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color: active ? activeColor : inactiveColor,
              display: "inline-block",
              transform: `scale(${scale})`,
              transformOrigin: "center bottom",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
