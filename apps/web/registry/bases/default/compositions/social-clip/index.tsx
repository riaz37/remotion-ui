import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AudiogramScene } from "@/remotion/scenes/audiogram-scene";
import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { EndCard } from "@/remotion/scenes/end-card";

const SCENE_DURATIONS = {
  hook: 60,
  body: 120,
  end: 60,
} as const;

const FADE = transitionFade({ durationInFrames: 12 });

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
  hookTitle = "Clip the sharpest moment",
  hookSubtitle = "A creator-ready social cut",
  logoSrc,
  audioSrc,
  captions,
  podcastTitle = "Founder Notes",
  ctaTitle = "Creator Cut",
  ctaLabel = "Follow for more",
  ctaUrl,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <AutoFitTitle
            title={hookTitle}
            subtitle={hookSubtitle}
            logoSrc={logoSrc}
            maxFontSize={72}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.body}>
          <AbsoluteFill>
            <AudiogramScene
              src={audioSrc}
              title={podcastTitle}
              logoSrc={logoSrc}
              backgroundColor="#0f172a"
            />
            <CaptionScene
              captions={captions}
              placement="lower-third"
              activeColor="#60a5fa"
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...FADE} />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
          <EndCard title={ctaTitle} cta={ctaLabel} logoSrc={logoSrc} url={ctaUrl} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
