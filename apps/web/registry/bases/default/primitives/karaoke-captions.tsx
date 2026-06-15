import type { TikTokPage } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { getAbsoluteTimeMs, isTokenActive } from "@/remotion/lib/caption-utils";

export type KaraokeCaptionMode = "scale" | "underline";

export type KaraokeCaptionsProps = {
  page: TikTokPage;
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  mode?: KaraokeCaptionMode;
};

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
  page,
  activeColor = "#fcd34d",
  inactiveColor = "rgba(248, 250, 252, 0.72)",
  fontSize: fontSizeProp,
  fontWeight = 800,
  mode = "scale",
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0.2em",
        color: inactiveColor,
        fontSize,
        fontWeight,
        lineHeight: 1.15,
        textAlign: "center",
        textShadow: "0 3px 18px rgba(0, 0, 0, 0.7)",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color: active ? activeColor : inactiveColor,
              transform: active && mode === "scale" ? "scale(1.08)" : "scale(1)",
              transformOrigin: "center bottom",
              display: "inline-block",
              borderBottom:
                active && mode === "underline"
                  ? `0.1em solid ${activeColor}`
                  : "0.1em solid transparent",
            }}
          >
            {token.text.trim()}
          </span>
        );
      })}
    </div>
  );
};
