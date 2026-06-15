import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { BRollStack, type BRollItem } from "@/remotion/scenes/b-roll-stack";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { CommentCallout } from "@/remotion/scenes/comment-callout";
import { EndCard } from "@/remotion/scenes/end-card";
import { HookCard } from "@/remotion/scenes/hook-card";
import {
  TalkingHeadLayout,
  type TalkingHeadLayoutProps,
} from "@/remotion/scenes/talking-head-layout";

const COLORS = {
  bg: "#09090b",
  hook: "#f97316",
  talk: "#22c55e",
  comment: "#a78bfa",
  commentBg: "#111827",
  bRoll: "#38bdf8",
  bRollBg: "#082f49",
  endBg: "#0c0a09",
  endAccent: "#fb923c",
} as const;

const fade = transitionFade({ durationInFrames: DURATION.fast });

const svgData = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

const SCRIPT_MEDIA = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#1c1410"/>
  <rect x="180" y="88" width="920" height="544" rx="36" fill="#292017" stroke="#fbbf24" stroke-width="2" opacity=".95"/>
  <rect x="240" y="156" width="520" height="28" rx="14" fill="#fbbf24" opacity=".85"/>
  <rect x="240" y="214" width="760" height="18" rx="9" fill="#fde68a" opacity=".55"/>
  <rect x="240" y="252" width="680" height="18" rx="9" fill="#fde68a" opacity=".42"/>
  <rect x="240" y="290" width="720" height="18" rx="9" fill="#fde68a" opacity=".42"/>
  <rect x="240" y="328" width="580" height="18" rx="9" fill="#fde68a" opacity=".35"/>
  <rect x="240" y="396" width="340" height="18" rx="9" fill="#f59e0b" opacity=".72"/>
  <rect x="240" y="434" width="480" height="18" rx="9" fill="#fde68a" opacity=".35"/>
  <circle cx="1040" cy="580" r="72" fill="#fbbf24" opacity=".22"/>
  <text x="240" y="560" font-family="Arial,sans-serif" font-size="52" font-weight="800" fill="#fef3c7">Script</text>
  <text x="242" y="610" font-family="Arial,sans-serif" font-size="26" fill="#fcd34d">Outline beats before you hit record</text>
</svg>`);

const RECORD_MEDIA = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#140a12"/>
  <circle cx="640" cy="320" r="168" fill="#fb7185" opacity=".18"/>
  <rect x="470" y="170" width="340" height="300" rx="28" fill="#1f1018" stroke="#fb7185" stroke-width="3"/>
  <circle cx="640" cy="290" r="62" fill="#fb7185" opacity=".92"/>
  <rect x="556" y="392" width="168" height="52" rx="26" fill="#fda4af" opacity=".75"/>
  <rect x="220" y="520" width="180" height="12" rx="6" fill="#fb7185" opacity=".55"/>
  <rect x="220" y="548" width="240" height="12" rx="6" fill="#fb7185" opacity=".38"/>
  <rect x="880" y="520" width="180" height="12" rx="6" fill="#fb7185" opacity=".55"/>
  <rect x="840" y="548" width="260" height="12" rx="6" fill="#fb7185" opacity=".38"/>
  <text x="220" y="640" font-family="Arial,sans-serif" font-size="52" font-weight="800" fill="#ffe4e6">Record</text>
  <text x="222" y="686" font-family="Arial,sans-serif" font-size="26" fill="#fda4af">Camera, mic, and one clean take</text>
</svg>`);

const PUBLISH_MEDIA = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#071510"/>
  <rect x="120" y="100" width="1040" height="520" rx="40" fill="#0f2419" opacity=".92"/>
  <rect x="180" y="168" width="420" height="280" rx="24" fill="#34d399" opacity=".78"/>
  <path d="M360 278 L420 318 L360 358 Z" fill="#022c22" opacity=".85"/>
  <rect x="660" y="196" width="420" height="44" rx="22" fill="#ecfdf5" opacity=".82"/>
  <rect x="660" y="268" width="320" height="28" rx="14" fill="#a7f3d0" opacity=".65"/>
  <rect x="660" y="324" width="380" height="28" rx="14" fill="#a7f3d0" opacity=".45"/>
  <rect x="660" y="420" width="220" height="64" rx="32" fill="#10b981"/>
  <text x="700" y="462" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#022c22">Publish</text>
  <text x="180" y="620" font-family="Arial,sans-serif" font-size="52" font-weight="800" fill="#d1fae5">Publish</text>
  <text x="182" y="666" font-family="Arial,sans-serif" font-size="26" fill="#6ee7b7">Export, caption, and ship the clip</text>
</svg>`);

const DEFAULT_CAPTIONS: Caption[] = [
  { text: " Build", startMs: 0, endMs: 360, timestampMs: 0, confidence: 1 },
  { text: " creator", startMs: 360, endMs: 780, timestampMs: 360, confidence: 1 },
  { text: " clips", startMs: 780, endMs: 1200, timestampMs: 780, confidence: 1 },
  { text: " faster", startMs: 1200, endMs: 1800, timestampMs: 1200, confidence: 1 },
];

const DEFAULT_B_ROLL: BRollItem[] = [
  { src: SCRIPT_MEDIA, title: "Script" },
  { src: RECORD_MEDIA, title: "Record" },
  { src: PUBLISH_MEDIA, title: "Publish" },
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
  talkingHeadTitle?: string;
  talkingHeadSubtitle?: string;
};

export const CreatorReel: React.FC<CreatorReelProps> = ({
  hookHeadline = "Make the hook impossible to skip",
  hookSubtitle = "Script, record, and publish in one reel template.",
  mediaSrc,
  mediaFit = "cover",
  audioSrc,
  captions = DEFAULT_CAPTIONS,
  comment = "Can you turn this into a quick video breakdown?",
  author = "Mina Lee",
  bRollItems = DEFAULT_B_ROLL,
  ctaTitle,
  ctaLabel,
  accentColor = COLORS.hook,
  talkingHeadTitle = "Put the speaker first",
  talkingHeadSubtitle = "Lower third stays open for captions and social UI.",
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={64}>
        <HookCard
          headline={hookHeadline}
          subtitle={hookSubtitle}
          accentColor={accentColor}
          backgroundColor={COLORS.bg}
          kicker="Creator workflow"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={120}>
        <AbsoluteFill>
          <TalkingHeadLayout
            mediaSrc={mediaSrc}
            fit={mediaFit}
            audioSrc={audioSrc}
            accentColor={COLORS.talk}
            title={talkingHeadTitle}
            subtitle={talkingHeadSubtitle}
          />
          <CaptionScene
            captions={captions}
            placement="lower-third"
            activeColor={COLORS.talk}
            mode="karaoke-scale"
          />
        </AbsoluteFill>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={78}>
        <CommentCallout
          body={comment}
          author={author}
          accentColor={COLORS.comment}
          backgroundColor={COLORS.commentBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={90}>
        <BRollStack
          items={bRollItems}
          title="Script → Record → Publish"
          accentColor={COLORS.bRoll}
          backgroundColor={COLORS.bRollBg}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={56}>
        <EndCard
          title={ctaTitle ?? hookHeadline}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
