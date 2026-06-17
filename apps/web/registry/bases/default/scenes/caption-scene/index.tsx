import { loadFont } from "@remotion/google-fonts/Inter";
import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";
import { KaraokeCaptions } from "@/remotion/primitives/karaoke-captions";
import {
  DEFAULT_CAPTION_PAGE_MS,
  getPageSequenceTiming,
  groupCaptionsIntoPages,
} from "@/remotion/lib/caption-utils";
import { getSafeAreaPadding, scaleFont, type SafeAreaPadding } from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
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
  active: "#e8b86d",
  inactive: "#fafafa",
  scrim: "rgba(8,10,16,0.88)",
  plate: "rgba(8,10,16,0.58)",
} as const;

type CaptionPageProps = {
  page: ReturnType<typeof groupCaptionsIntoPages>[number];
  mode: CaptionSceneMode;
  activeColor: string;
  inactiveColor: string;
  fontSize: number;
  placement: CaptionPlacement;
  captionZoneWidth: number;
  safeArea: SafeAreaPadding;
  bottomSlot: number;
};

function CaptionPage({
  page,
  mode,
  activeColor,
  inactiveColor,
  fontSize,
  placement,
  captionZoneWidth,
  safeArea,
  bottomSlot,
}: CaptionPageProps) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const pageEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  const content =
    mode === "karaoke-scale" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        fontSize={fontSize}
        mode="scale"
      />
    ) : mode === "karaoke-underline" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        fontSize={fontSize}
        mode="underline"
      />
    ) : (
      <CaptionHighlight
        page={page}
        frame={frame}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        fontSize={fontSize}
        activeScale={1.08}
      />
    );

  const platePaddingY = scaleFont(12, width);
  const platePaddingX = scaleFont(20, width);
  const plateRadius = scaleFont(12, width);

  if (placement === "center") {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: safeArea.paddingTop,
            right: safeArea.paddingRight,
            bottom: safeArea.paddingBottom,
            left: safeArea.paddingLeft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: pageEnter,
            transform: `translateY(${interpolate(pageEnter, [0, 1], [12, 0])}px)`,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: captionZoneWidth,
              padding: `${platePaddingY}px ${platePaddingX}px`,
              borderRadius: plateRadius,
              background: COLORS.plate,
              textAlign: "center",
            }}
          >
            {content}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: safeArea.paddingLeft,
          right: safeArea.paddingRight,
          bottom: bottomSlot,
          display: "flex",
          justifyContent: "center",
          opacity: pageEnter,
          transform: `translateY(${interpolate(pageEnter, [0, 1], [14, 0])}px)`,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: captionZoneWidth,
            padding: `${platePaddingY}px ${platePaddingX}px`,
            borderRadius: plateRadius,
            background: COLORS.plate,
            textAlign: "center",
          }}
        >
          {content}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const CaptionScene: React.FC<CaptionSceneProps> = ({
  captions,
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
  activeColor = COLORS.active,
  inactiveColor = COLORS.inactive,
  backgroundColor = "transparent",
  placement = "lower-third",
  mode = "highlight",
}) => {
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const fontSize = scaleFont(placement === "center" ? 52 : 48, width);
  const bottomSlot = Math.max(
    safeArea.paddingBottom,
    Math.round(height * 0.12),
  );

  const pages = useMemo(
    () => groupCaptionsIntoPages(captions, combineTokensWithinMilliseconds),
    [captions, combineTokensWithinMilliseconds],
  );

  const captionZoneWidth = width - safeArea.paddingLeft - safeArea.paddingRight;

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily }}>
      {placement === "lower-third" ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "42%",
            background: `linear-gradient(to top, ${COLORS.scrim} 0%, transparent 100%)`,
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
            layout="none"
          >
            <CaptionPage
              page={page}
              mode={mode}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              fontSize={fontSize}
              placement={placement}
              captionZoneWidth={captionZoneWidth}
              safeArea={safeArea}
              bottomSlot={bottomSlot}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
