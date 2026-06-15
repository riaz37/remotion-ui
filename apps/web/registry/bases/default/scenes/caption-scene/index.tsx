import { loadFont } from "@remotion/google-fonts/Inter";
import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";
import { KaraokeCaptions } from "@/remotion/primitives/karaoke-captions";
import {
  DEFAULT_CAPTION_PAGE_MS,
  getPageSequenceTiming,
  groupCaptionsIntoPages,
} from "@/remotion/lib/caption-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
});

export type CaptionPlacement = "lower-third" | "center";

export type CaptionSceneMode =
  | "highlight"
  | "karaoke-scale"
  | "karaoke-underline";

export type CaptionSceneProps = {
  captions: Caption[];
  combineTokensWithinMilliseconds?: number;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  placement?: CaptionPlacement;
  mode?: CaptionSceneMode;
};

const COLORS = {
  active: "#fbbf24",
  inactive: "#fafafa",
  scrim: "rgba(8,10,16,0.88)",
} as const;

export const CaptionScene: React.FC<CaptionSceneProps> = ({
  captions,
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
  activeColor = COLORS.active,
  inactiveColor = COLORS.inactive,
  backgroundColor = "transparent",
  placement = "lower-third",
  mode = "karaoke-scale",
}) => {
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const fontSize = scaleFont(placement === "center" ? 48 : 40, width);

  const pages = useMemo(
    () => groupCaptionsIntoPages(captions, combineTokensWithinMilliseconds),
    [captions, combineTokensWithinMilliseconds],
  );

  const pageLayoutStyle =
    placement === "center"
      ? {
          justifyContent: "center" as const,
          alignItems: "center" as const,
          paddingLeft: safeArea.paddingLeft,
          paddingRight: safeArea.paddingRight,
          fontFamily,
        }
      : {
          justifyContent: "flex-end" as const,
          alignItems: "center" as const,
          paddingLeft: safeArea.paddingLeft,
          paddingRight: safeArea.paddingRight,
          paddingBottom: safeArea.paddingBottom,
          fontFamily,
        };

  const renderPage = (page: (typeof pages)[number]) => {
    if (mode === "karaoke-scale") {
      return (
        <KaraokeCaptions
          page={page}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          fontSize={fontSize}
          mode="scale"
        />
      );
    }

    if (mode === "karaoke-underline") {
      return (
        <KaraokeCaptions
          page={page}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          fontSize={fontSize}
          mode="underline"
        />
      );
    }

    return (
      <CaptionHighlight
        page={page}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        fontSize={fontSize}
        activeScale={1.08}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {placement === "lower-third" ? (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            background: `linear-gradient(to top, ${COLORS.scrim} 0%, transparent 58%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {pages.map((page, index) => {
        const { startFrame, durationInFrames } = getPageSequenceTiming(
          pages,
          index,
          fps,
          combineTokensWithinMilliseconds,
        );

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={`${page.startMs}-${index}`}
            from={Math.round(startFrame)}
            durationInFrames={Math.round(durationInFrames)}
          >
            <AbsoluteFill style={pageLayoutStyle}>{renderPage(page)}</AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
