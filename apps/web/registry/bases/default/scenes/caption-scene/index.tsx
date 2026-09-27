import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/Inter";
import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  Loop,
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

/**
 * How the caption sits on the footage:
 * - `shadow` — bare text with a drop shadow, the standard broadcast/YouTube
 *   lower-third treatment. Nothing behind the words but the video itself.
 * - `boxed` — a solid line-hugging background behind each page, the
 *   Reels/YouTube auto-caption convention. Use this over very busy or
 *   low-contrast footage where a shadow alone will not hold up.
 */
export type CaptionSceneStyle = "shadow" | "boxed";

export type CaptionSceneProps = {
  captions: Caption[];
  combineTokensWithinMilliseconds?: number;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  placement?: CaptionPlacement;
  mode?: CaptionSceneMode;
  /** Defaults to `"shadow"` — a direct-on-footage caption, no card. */
  style?: CaptionSceneStyle;
  /**
   * How long this scene actually plays for. Pass the enclosing `Sequence`'s
   * `durationInFrames` when the scene is nested inside one (it is shorter
   * than `useVideoConfig().durationInFrames`, which always reports the full
   * composition). Falls back to the composition duration when omitted.
   */
  durationInFrames?: number;
};

const COLORS = {
  active: "#ff6b00",
  boxBackground: "rgba(9, 9, 11, 0.72)",
} as const;

type CaptionPageProps = {
  page: ReturnType<typeof groupCaptionsIntoPages>[number];
  mode: CaptionSceneMode;
  style: CaptionSceneStyle;
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
  style,
  activeColor,
  inactiveColor,
  fontSize,
  placement,
  captionZoneWidth,
  safeArea,
  bottomSlot,
}: CaptionPageProps) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  const boxed = style === "boxed";
  const karaokeInactive = boxed ? "rgba(255,255,255,0.44)" : inactiveColor;

  const content =
    mode === "karaoke-scale" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        completedColor={boxed ? inactiveColor : "#ffffff"}
        inactiveColor={karaokeInactive}
        fontSize={fontSize}
        mode="scale"
        shadow={!boxed}
      />
    ) : mode === "karaoke-underline" ? (
      <KaraokeCaptions
        page={page}
        frame={frame}
        activeColor={activeColor}
        completedColor={boxed ? inactiveColor : "#ffffff"}
        inactiveColor={karaokeInactive}
        fontSize={fontSize}
        mode="underline"
        shadow={!boxed}
      />
    ) : (
      <CaptionHighlight
        page={page}
        frame={frame}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        fontSize={fontSize}
        textAlign={placement === "center" ? "center" : "left"}
        shadow={!boxed}
      />
    );

  const centered = placement === "center";
  const boxPaddingY = scaleFont(14, width);
  const boxPaddingX = scaleFont(22, width);

  const body = boxed ? (
    <div
      style={{
        width: "100%",
        maxWidth: captionZoneWidth,
        borderRadius: scaleFont(8, width),
        background: COLORS.boxBackground,
        padding: `${boxPaddingY}px ${boxPaddingX}px`,
      }}
    >
      {content}
    </div>
  ) : (
    <div style={{ width: "100%", maxWidth: captionZoneWidth }}>{content}</div>
  );

  // Content lives in a flex slot inside the safe area — never raw top/left offsets,
  // so long copy pushes the box instead of overflowing the frame.
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
            ["0px 10px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.enter,
            },
          ),
        }}
      >
        {body}
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
  style = "shadow",
  durationInFrames,
}) => {
  const config = useVideoConfig();
  const { fps, width, height } = config;
  // `useVideoConfig().durationInFrames` is always the *composition's* total
  // length. When this scene sits inside a bounded `<Sequence>` (a
  // TransitionSeries slot, for instance) that slot is shorter, so the caller
  // must pass its own `durationInFrames` — otherwise the fallback below is
  // the best available estimate.
  const targetDuration = durationInFrames ?? config.durationInFrames;
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
    Math.round(width * (placement === "center" ? 0.74 : 0.86)),
  );

  // The last page's own `getPageSequenceTiming` duration is bounded by its
  // own spoken span (there is no next page to bound it against) — that is
  // shorter than however long the parent actually gives this scene to play.
  // Wrapping every pass in `<Loop>` re-plays the caption pages for the rest
  // of the assigned duration instead of leaving the scene blank once the
  // transcript runs out.
  const naturalDuration = useMemo(() => {
    if (pages.length === 0) {
      return 0;
    }
    const last = pages[pages.length - 1];
    return Math.max(
      1,
      Math.round(((last.startMs + last.durationMs) / 1000) * fps),
    );
  }, [pages, fps]);

  const loopTimes =
    naturalDuration > 0
      ? Math.max(1, Math.ceil(targetDuration / naturalDuration))
      : 0;

  const pageSequences = pages.map((page, index) => {
    const { startFrame, durationInFrames: pageDuration } =
      getPageSequenceTiming(pages, index, fps, combineTokensWithinMilliseconds);

    if (pageDuration <= 0) {
      return null;
    }

    return (
      <Sequence
        key={`${page.startMs}-${index}`}
        from={Math.round(startFrame)}
        durationInFrames={Math.round(pageDuration)}
        layout="none"
      >
        <CaptionPage
          page={page}
          mode={mode}
          style={style}
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
  });

  // A shadow-only caption over a bright, low-contrast frame (a white product
  // screen, a sky) can still lose the text — the scrim buys a guaranteed
  // contrast floor without putting a card behind every word. Skipped for
  // `boxed`, which already carries its own background.
  const showScrim = style === "shadow" && placement === "lower-third";

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily }}>
      {showScrim ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            left: 0,
            height: "40%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {loopTimes > 0 ? (
        <Loop
          durationInFrames={naturalDuration}
          times={loopTimes}
          layout="none"
        >
          {pageSequences}
        </Loop>
      ) : null}
    </AbsoluteFill>
  );
};
