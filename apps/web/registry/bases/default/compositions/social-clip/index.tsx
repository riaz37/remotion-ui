import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { AudiogramScene } from "@/remotion/scenes/audiogram-scene";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { EndCard } from "@/remotion/scenes/end-card";

const COLORS = {
  bg: "#050508",
  hookBg: "#1a1510",
  hookAccent: "#e8b86d",
  bodyBg: "#0c1222",
  bodyAccent: "#f59e0b",
  captionActive: "#f59e0b",
  endBg: "#111827",
  endAccent: "#2dd4bf",
} as const;

const SCENE_DURATIONS = {
  hook: 60,
  body: 120,
  end: 60,
} as const;

const FADE = transitionFade({ durationInFrames: DURATION.fast });

export type SocialClipProps = {
  hookTitle?: string;
  hookSubtitle?: string;
  logoSrc?: string;
  audioSrc: string;
  captions: Caption[];
  podcastTitle?: string;
  ctaTitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export const SocialClip: React.FC<SocialClipProps> = ({
  hookTitle = "This line stops the scroll",
  hookSubtitle = "Lead with the sharpest quote from the episode",
  logoSrc,
  audioSrc,
  captions,
  podcastTitle = "Weekly Brief",
  ctaTitle = "Hear the full episode",
  ctaLabel,
  ctaUrl,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <AutoFitTitle
            title={hookTitle}
            subtitle={hookSubtitle}
            logoSrc={logoSrc}
            maxFontSize={72}
            accentColor={COLORS.hookAccent}
            backgroundColor={COLORS.hookBg}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.body}>
          <AbsoluteFill>
            <AudiogramScene
              src={audioSrc}
              title={podcastTitle}
              logoSrc={logoSrc}
              backgroundColor={COLORS.bodyBg}
              accentColor={COLORS.bodyAccent}
            />
            <CaptionScene
              captions={captions}
              placement="lower-third"
              activeColor={COLORS.captionActive}
              mode="karaoke-scale"
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard
            title={ctaTitle}
            cta={ctaLabel}
            logoSrc={logoSrc}
            url={ctaUrl}
            backgroundColor={COLORS.endBg}
            accentColor={COLORS.endAccent}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
