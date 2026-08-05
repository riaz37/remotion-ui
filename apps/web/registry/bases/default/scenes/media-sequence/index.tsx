import { loadFont } from "@remotion/google-fonts/Inter";
import { TransitionSeries } from "@remotion/transitions";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { resolveMediaWindows, type MediaItem } from "@/remotion/lib/media-utils";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { transitionSlide } from "@/remotion/primitives/transition-slide";
import { MediaFrame } from "@/remotion/scenes/media-frame";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export type MediaSequenceProps = {
  items: MediaItem[];
  /** Length of an item that does not set its own `durationInFrames`. */
  defaultDurationInFrames?: number;
  transitionDurationInFrames?: number;
  /** `slide` pushes each item on from the right; `fade` dissolves. */
  transition?: "slide" | "fade";
  /** Chapter strip along the foot, showing which item is playing. */
  showProgress?: boolean;
  /** Aspect the frames are cut to. */
  aspect?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * An edited run of shots rather than a slideshow: each item is pushed on by the
 * next, and a chapter strip along the foot fills through the item that is
 * playing and stays filled behind it — so the viewer can see where they are in
 * the sequence and how much is left.
 */
export const MediaSequence: React.FC<MediaSequenceProps> = ({
  items,
  defaultDurationInFrames = 78,
  transitionDurationInFrames = 14,
  transition = "slide",
  showProgress = true,
  aspect = 16 / 9,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });
  const u = Math.min(width / 1280, height / 720);

  const windows = resolveMediaWindows(items, defaultDurationInFrames);
  const moveFade = transitionFade({
    durationInFrames: transitionDurationInFrames,
  });
  const moveSlide = transitionSlide({
    durationInFrames: transitionDurationInFrames,
    direction: "from-right",
  });

  // A TransitionSeries overlaps neighbours, so an item's real start is its
  // cumulative offset minus the transitions already consumed before it.
  const startOf = (index: number) =>
    windows
      .slice(0, index)
      .reduce((total, window) => total + window.durationInFrames, 0) -
    index * transitionDurationInFrames;

  const stripW = width - safe.paddingLeft - safe.paddingRight;
  const segmentGap = 8 * u;
  const segmentW =
    (stripW - segmentGap * Math.max(windows.length - 1, 0)) /
    Math.max(windows.length, 1);

  return (
    <AbsoluteFill
      style={{ backgroundColor: backgroundColor ?? palette.page, fontFamily }}
    >
      <TransitionSeries>
        {windows.map((item, index) => (
          <React.Fragment key={`${item.src}-${index}`}>
            <TransitionSeries.Sequence durationInFrames={item.durationInFrames}>
              <MediaFrame
                src={item.src}
                title={item.title}
                caption={item.caption}
                fit={item.fit ?? "contain"}
                aspect={aspect}
                accentColor={accentColor}
                theme={theme}
                backgroundColor={item.backgroundColor ?? backgroundColor}
              />
            </TransitionSeries.Sequence>
            {index < windows.length - 1 ? (
              // Split rather than spreading one union: the two presentations
              // carry different prop shapes, and a single spread would force
              // `TransitionSeries.Transition` to pick one of them.
              transition === "fade" ? (
                <TransitionSeries.Transition {...moveFade} />
              ) : (
                <TransitionSeries.Transition {...moveSlide} />
              )
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>

      {showProgress && windows.length > 1 ? (
        <div
          style={{
            position: "absolute",
            left: safe.paddingLeft,
            right: safe.paddingRight,
            bottom: safe.paddingBottom * 0.4,
            display: "flex",
            alignItems: "center",
            gap: segmentGap,
          }}
        >
          {windows.map((item, index) => {
            const start = startOf(index);
            const fill = interpolate(
              frame,
              [start, start + item.durationInFrames],
              [0, 1],
              { easing: EASING.editorial, ...clamp },
            );
            return (
              <div
                key={`chapter-${item.src}-${index}`}
                style={{
                  width: segmentW,
                  height: 4 * u,
                  borderRadius: 999,
                  background: palette.band,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: "100%",
                    background: accentColor,
                    opacity: fill > 0 && fill < 1 ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
