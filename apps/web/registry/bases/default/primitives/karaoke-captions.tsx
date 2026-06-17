import type { TikTokPage } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { getTokenEmphasis, isTokenActive, getAbsoluteTimeMs } from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";

export type KaraokeCaptionMode = "scale" | "underline";

export type KaraokeCaptionsProps = {
  page: TikTokPage;
  activeColor?: string;
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
  activeColor = "#e8b86d",
  inactiveColor = "rgba(250, 250, 250, 0.72)",
  fontSize: fontSizeProp,
  fontWeight = 800,
  mode = "scale",
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
        color: inactiveColor,
        fontSize,
        fontWeight,
        lineHeight: 1.15,
        textAlign: "center",
        whiteSpace: "pre",
        textShadow: "0 3px 18px rgba(0, 0, 0, 0.7)",
      }}
    >
      {page.tokens.map((token) => {
        const active = isTokenActive(token, absoluteTimeMs);
        const emphasis = clamp01(getTokenEmphasis(frame, token, page, fps));
        const scale = mode === "scale" ? 1 + emphasis * 0.08 : 1;
        const underlineOpacity = emphasis;

        return (
          <span
            key={`${token.fromMs}-${token.text}`}
            style={{
              color: active ? activeColor : inactiveColor,
              transform: mode === "scale" ? `scale(${scale})` : "scale(1)",
              transformOrigin: "center bottom",
              display: "inline-block",
              borderBottom:
                mode === "underline"
                  ? `0.1em solid rgba(250,250,250,${0.18 + underlineOpacity * 0.56})`
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
