import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/Inter";
import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";
import { KaraokeCaptions } from "@/remotion/primitives/karaoke-captions";
import {
  DEFAULT_CAPTION_PAGE_MS,
  getPageSequenceTiming,
  groupCaptionsIntoPages,
} from "@/remotion/lib/caption-utils";
import {
  getSafeAreaPadding,
  scaleFont,
  type SafeAreaPadding,
} from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
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
  label?: string;
};

const COLORS = {
  active: "#ff6b00",
  ink: "#111111",
  paper: "#f5f4f2",
  plate: "rgba(245, 244, 242, 0.92)",
  plateDark: "rgba(17, 17, 17, 0.78)",
  border: "rgba(17, 17, 17, 0.12)",
  muted: "rgba(17, 17, 17, 0.52)",
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
  label: string;
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
  label,
}: CaptionPageProps) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const pageProgress = interpolate(
    frame,
    [0, Math.max(1, (page.durationMs / 1000) * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const content =
    mode === "karaoke-scale" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        completedColor={inactiveColor}
        inactiveColor="rgba(255,255,255,0.44)"
        fontSize={fontSize}
        mode="scale"
      />
    ) : mode === "karaoke-underline" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        completedColor={inactiveColor}
        inactiveColor="rgba(255,255,255,0.44)"
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
        textAlign={placement === "center" ? "center" : "left"}
      />
    );

  const platePaddingY = scaleFont(18, width);
  const platePaddingX = scaleFont(24, width);
  const progressHeight = Math.max(3, scaleFont(3, width));
  const labelSize = Math.max(12, scaleFont(14, width));

  const plate = (
    <div
      style={{
        width: "100%",
        maxWidth: captionZoneWidth,
        border: `1px solid rgba(255,255,255,0.18)`,
        borderRadius: scaleFont(10, width),
        background: COLORS.plateDark,
        color: inactiveColor,
        overflow: "hidden",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.26)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: scaleFont(10, width),
          padding: `${platePaddingY}px ${platePaddingX}px ${scaleFont(10, width)}px`,
        }}
      >
        <div
          style={{
            width: scaleFont(7, width),
            height: scaleFont(7, width),
            borderRadius: 999,
            background: activeColor,
          }}
        />
        <div
          style={{
            color: "rgba(255,255,255,0.64)",
            fontSize: labelSize,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          padding: `0 ${platePaddingX}px ${platePaddingY}px`,
        }}
      >
        {content}
      </div>
      <div
        style={{
          height: progressHeight,
          background: "rgba(255,255,255,0.14)",
        }}
      >
        <div
          style={{
            width: `${pageProgress * 100}%`,
            height: "100%",
            background: activeColor,
          }}
        />
      </div>
    </div>
  );

  const centered = placement === "center";

  // Content lives in a flex slot inside the safe area — never raw top/left offsets,
  // so long copy pushes the plate instead of overflowing the frame.
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: centered ? "center" : "flex-end",
        paddingTop: safeArea.paddingTop,
        paddingRight: safeArea.paddingRight,
        paddingBottom: centered ? safeArea.paddingBottom : bottomSlot,
        paddingLeft: safeArea.paddingLeft,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          opacity: enter,
          translate: interpolate(
            frame,
            [0, DURATION.fast],
            ["0px 14px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.enter,
            },
          ),
          // Second beat: the plate settles slightly after it rises.
          scale: interpolate(frame, [0, DURATION.normal], [0.972, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASING.enter,
            output: "perceptual-scale",
          }),
        }}
      >
        {plate}
      </div>
    </AbsoluteFill>
  );
}

export const CaptionScene: React.FC<CaptionSceneProps> = ({
  captions,
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
  activeColor = COLORS.active,
  inactiveColor = "#ffffff",
  backgroundColor = "transparent",
  placement = "lower-third",
  mode = "highlight",
  label = "Caption",
}) => {
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const fontSize = scaleFont(placement === "center" ? 54 : 48, width);
  const bottomSlot = Math.max(
    safeArea.paddingBottom,
    Math.round(height * 0.1),
  );

  const pages = useMemo(
    () => groupCaptionsIntoPages(captions, combineTokensWithinMilliseconds),
    [captions, combineTokensWithinMilliseconds],
  );

  const captionZoneWidth = Math.min(
    width - safeArea.paddingLeft - safeArea.paddingRight,
    Math.round(width * (placement === "center" ? 0.74 : 0.82)),
  );

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily }}>
      {placement === "lower-third" ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            left: 0,
            height: "46%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
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
              label={label}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
