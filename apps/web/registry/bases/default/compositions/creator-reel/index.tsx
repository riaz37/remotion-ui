import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { BRollStack, type BRollItem } from "@/remotion/scenes/b-roll-stack";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { CommentCallout } from "@/remotion/scenes/comment-callout";
import { EndCard } from "@/remotion/scenes/end-card";
import { HookCard } from "@/remotion/scenes/hook-card";
import {
  TalkingHeadLayout,
  type TalkingHeadLayoutProps,
} from "@/remotion/scenes/talking-head-layout";

const fade = transitionFade({ durationInFrames: 12 });

const DEFAULT_CAPTIONS: Caption[] = [
  { text: " Build", startMs: 0, endMs: 360, timestampMs: 0, confidence: 1 },
  { text: " creator", startMs: 360, endMs: 780, timestampMs: 360, confidence: 1 },
  { text: " clips", startMs: 780, endMs: 1200, timestampMs: 780, confidence: 1 },
  { text: " faster", startMs: 1200, endMs: 1800, timestampMs: 1200, confidence: 1 },
];

const DEFAULT_MEDIA_CARD =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%23020617'/%3E%3Ccircle cx='980' cy='140' r='190' fill='%2338bdf8' opacity='.28'/%3E%3Crect x='120' y='120' width='560' height='340' rx='34' fill='%23f8fafc' opacity='.12'/%3E%3Crect x='160' y='176' width='410' height='34' rx='17' fill='%23f8fafc' opacity='.72'/%3E%3Crect x='160' y='244' width='280' height='26' rx='13' fill='%2338bdf8' opacity='.9'/%3E%3Crect x='160' y='322' width='460' height='92' rx='24' fill='%230f172a' opacity='.75'/%3E%3Ctext x='120' y='590' font-family='Arial,sans-serif' font-size='62' font-weight='800' fill='%23f8fafc'%3ECreator step%3C/text%3E%3C/svg%3E";

const DEFAULT_B_ROLL: BRollItem[] = [
  {
    src: DEFAULT_MEDIA_CARD,
    title: "Script",
  },
  {
    src: DEFAULT_MEDIA_CARD,
    title: "Record",
  },
  {
    src: DEFAULT_MEDIA_CARD,
    title: "Publish",
  },
];

export type CreatorReelProps = {
  hookHeadline?: string;
  hookSubtitle?: string;
  mediaSrc?: string;
  mediaFit?: TalkingHeadLayoutProps["fit"];
  audioSrc?: string;
  captions?: Caption[];
  comment?: string;
  author?: string;
  bRollItems?: BRollItem[];
  ctaTitle?: string;
  ctaLabel?: string;
  accentColor?: string;
};

export const CreatorReel: React.FC<CreatorReelProps> = ({
  hookHeadline = "Make the hook impossible to skip",
  hookSubtitle = "A practical short-form template for creator clips.",
  mediaSrc,
  mediaFit = "cover",
  audioSrc,
  captions = DEFAULT_CAPTIONS,
  comment = "Can you turn this into a quick video breakdown?",
  author = "Mina Lee",
  bRollItems = DEFAULT_B_ROLL,
  ctaTitle = "Creator Reel",
  ctaLabel = "Build your next clip",
  accentColor = "#f97316",
}) => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={64}>
        <HookCard
          headline={hookHeadline}
          subtitle={hookSubtitle}
          accentColor={accentColor}
          kicker="Creator media"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={120}>
        <AbsoluteFill>
          <TalkingHeadLayout
            mediaSrc={mediaSrc}
            fit={mediaFit}
            audioSrc={audioSrc}
            accentColor="#22c55e"
            title="Put the speaker first"
            subtitle="The lower frame stays open for captions and social UI."
          />
          <CaptionScene
            captions={captions}
            placement="lower-third"
            activeColor="#22c55e"
          />
        </AbsoluteFill>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={78}>
        <CommentCallout
          body={comment}
          author={author}
          accentColor="#a78bfa"
          backgroundColor="#111827"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={90}>
        <BRollStack
          items={bRollItems}
          title="Add proof and texture"
          accentColor="#38bdf8"
          backgroundColor="#082f49"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={56}>
        <EndCard title={ctaTitle} cta={ctaLabel} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
