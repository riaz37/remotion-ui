import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";
import {
  DEFAULT_CAPTION_PAGE_MS,
  getPageSequenceTiming,
  groupCaptionsIntoPages,
} from "@/remotion/lib/caption-utils";
import { getSafeAreaPadding } from "@/remotion/lib/layout";

export type CaptionPlacement = "lower-third" | "center";

export type CaptionSceneProps = {
  captions: Caption[];
  combineTokensWithinMilliseconds?: number;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  placement?: CaptionPlacement;
};

export const CaptionScene: React.FC<CaptionSceneProps> = ({
  captions,
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
  activeColor = "#60a5fa",
  inactiveColor = "#f8fafc",
  backgroundColor = "transparent",
  placement = "lower-third",
}) => {
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const fontSize = Math.round(width * (placement === "center" ? 0.045 : 0.038));

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
        }
      : {
          justifyContent: "flex-end" as const,
          alignItems: "center" as const,
          paddingLeft: safeArea.paddingLeft,
          paddingRight: safeArea.paddingRight,
          paddingBottom: safeArea.paddingBottom,
        };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {placement === "lower-third" ? (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            background:
              "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 55%)",
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
            <AbsoluteFill style={pageLayoutStyle}>
              <CaptionHighlight
                page={page}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
                fontSize={fontSize}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
