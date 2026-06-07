import type { TikTokPage } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
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
};

export const CaptionHighlight: React.FC<CaptionHighlightProps> = ({
  page,
  activeColor = "#60a5fa",
  inactiveColor = "#f8fafc",
  fontSize = 48,
  fontWeight = "bold",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        whiteSpace: "pre",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        lineHeight: 1.25,
        textShadow: "0 2px 16px rgba(0, 0, 0, 0.65)",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{ color: active ? activeColor : inactiveColor }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
