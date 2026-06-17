import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { BRollStack, type BRollItem } from "@/remotion/scenes/b-roll-stack";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { CommentCallout } from "@/remotion/scenes/comment-callout";
import { EndCard } from "@/remotion/scenes/end-card";
import {
  TalkingHeadLayout,
  type TalkingHeadLayoutProps,
} from "@/remotion/scenes/talking-head-layout";

const COLORS = {
  bg: "#080810",
  hookBg: "#0c0c14",
  hookAccent: "#e8b86d",
  talkBg: "#0a1014",
  talkAccent: "#f59e0b",
  captionActive: "#f59e0b",
  commentBg: "#0c0c14",
  commentAccent: "#2dd4bf",
  bRollBg: "#080810",
  bRollAccent: "#e8b86d",
  endBg: "#080810",
  endAccent: "#f59e0b",
} as const;

const SCENE_DURATIONS = {
  hook: 68,
  talkingHead: 128,
  comment: 84,
  bRoll: 96,
  end: 62,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type CreatorReelProps = {
  hookHeadline?: string;
  hookSubtitle?: string;
  mediaSrc?: string;
  mediaFit?: TalkingHeadLayoutProps["fit"];
  audioSrc?: string;
  captions?: Caption[];
  comment?: string;
  author?: string;
  handle?: string;
  bRollItems?: BRollItem[];
  bRollTitle?: string;
  bRollKicker?: string;
  ctaTitle?: string;
  ctaLabel?: string;
  accentColor?: string;
  talkingHeadEyebrow?: string;
  talkingHeadTitle?: string;
};

export const CreatorReel: React.FC<CreatorReelProps> = ({
  hookHeadline = "Make the first second count",
  hookSubtitle = "Hook viewers before they scroll",
  mediaSrc,
  mediaFit = "cover",
  audioSrc,
  captions,
  comment = "Can you break down how you built that transition?",
  author = "Alex Chen",
  handle = "@alexchen",
  bRollItems = [],
  bRollTitle = "Script → Record → Publish",
  bRollKicker = "Proof beats",
  ctaTitle = "Install compositions as source",
  ctaLabel,
  accentColor = COLORS.hookAccent,
  talkingHeadEyebrow = "Creator workflow",
  talkingHeadTitle = "Clip the sharpest moment",
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
        <AutoFitTitle
          title={hookHeadline}
          subtitle={hookSubtitle}
          maxFontSize={72}
          accentColor={accentColor}
          backgroundColor={COLORS.hookBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.talkingHead}>
        <AbsoluteFill>
          <TalkingHeadLayout
            mediaSrc={mediaSrc}
            fit={mediaFit}
            audioSrc={audioSrc}
            eyebrow={talkingHeadEyebrow}
            title={talkingHeadTitle}
            accentColor={COLORS.talkAccent}
            backgroundColor={COLORS.talkBg}
          />
          {captions && captions.length > 0 ? (
            <CaptionScene
              captions={captions}
              placement="lower-third"
              activeColor={COLORS.captionActive}
              mode="karaoke-scale"
            />
          ) : null}
        </AbsoluteFill>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.comment}>
        <CommentCallout
          body={comment}
          author={author}
          handle={handle}
          accentColor={COLORS.commentAccent}
          backgroundColor={COLORS.commentBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.bRoll}>
        <BRollStack
          items={bRollItems}
          kicker={bRollKicker}
          title={bRollTitle}
          accentColor={COLORS.bRollAccent}
          backgroundColor={COLORS.bRollBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
        <EndCard
          title={ctaTitle}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
