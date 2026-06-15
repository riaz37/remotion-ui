import React from "react";
import { AbsoluteFill } from "remotion";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { MediaFrame } from "@/remotion/scenes/media-frame";
import { resolveMediaWindows, type MediaItem } from "@/remotion/lib/media-utils";
import { TransitionSeries } from "@remotion/transitions";

export type MediaSequenceProps = {
  items: MediaItem[];
  defaultDurationInFrames?: number;
  transitionDurationInFrames?: number;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#06080f",
} as const;

export const MediaSequence: React.FC<MediaSequenceProps> = ({
  items,
  defaultDurationInFrames = 90,
  transitionDurationInFrames = 12,
  backgroundColor = COLORS.bg,
}) => {
  const windows = resolveMediaWindows(items, defaultDurationInFrames);
  const fade = transitionFade({ durationInFrames: transitionDurationInFrames });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <TransitionSeries>
        {windows.map((item, index) => (
          <React.Fragment key={`${item.src}-${index}`}>
            <TransitionSeries.Sequence durationInFrames={item.durationInFrames}>
              <MediaFrame
                src={item.src}
                title={item.title}
                caption={item.caption}
                fit={item.fit}
                backgroundColor={item.backgroundColor ?? backgroundColor}
              />
            </TransitionSeries.Sequence>
            {index < windows.length - 1 ? (
              <TransitionSeries.Transition {...fade} />
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
