import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AudioPulse } from "@/remotion/primitives/audio-pulse";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { WaveformLine } from "@/remotion/primitives/waveform-line";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { EndCard } from "@/remotion/scenes/end-card";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800"],
  subsets: ["latin"],
});

const COLORS = {
  bg: "#080810",
  introBg: "#0c0c14",
  accent: "#e8b86d",
  accentSoft: "#f5d08a",
  studioBg: "#0a1014",
  studioGlow: "rgba(232,184,109,0.14)",
  waveform: "#f59e0b",
  quoteBg: "#080810",
  endBg: "#080810",
  endAccent: "#2dd4bf",
  muted: "#71717a",
} as const;

const fade = transitionFade({ durationInFrames: DURATION.fast });

export type PodcastClipProps = {
  audioSrc: string;
  captions: Caption[];
  title?: string;
  subtitle?: string;
  showName?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const PodcastIntro: React.FC<{
  title: string;
  subtitle: string;
  audioSrc: string;
}> = ({ title, subtitle, audioSrc }) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const pulseSize = scaleFont(280, width);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.introBg,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 30%, ${COLORS.studioGlow}, transparent)`,
        ...safeArea,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: scaleFont(36, width),
      }}
    >
      <FadeIn durationInFrames={DURATION.fast}>
        <AudioPulse src={audioSrc} size={pulseSize} color={COLORS.accent} ringCount={4} />
      </FadeIn>
      <FadeIn delayInFrames={DURATION.fast} durationInFrames={DURATION.fast}>
        <div style={{ textAlign: "center", maxWidth: width * 0.72 }}>
          <p
            style={{
              margin: 0,
              color: COLORS.accentSoft,
              fontSize: scaleFont(28, width),
              fontWeight: 700,
            }}
          >
            Podcast clip
          </p>
          <h1
            style={{
              margin: `${scaleFont(16, width)}px 0 0`,
              color: "#fafafa",
              fontSize: scaleFont(72, width),
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: `${scaleFont(18, width)}px 0 0`,
              color: COLORS.muted,
              fontSize: scaleFont(34, width),
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </p>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const PodcastStudio: React.FC<{
  audioSrc: string;
  showName: string;
  episodeTitle: string;
}> = ({ audioSrc, showName, episodeTitle }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const pulseSize = scaleFont(200, width);
  const breathe = 1 + Math.sin(frame / 14) * 0.04;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.studioBg,
        backgroundImage: `radial-gradient(circle at 50% 38%, ${COLORS.studioGlow}, transparent 55%)`,
        ...safeArea,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FadeIn durationInFrames={DURATION.fast}>
        <div style={{ paddingTop: scaleFont(12, width) }}>
          <p
            style={{
              margin: 0,
              color: COLORS.accentSoft,
              fontSize: scaleFont(26, width),
              fontWeight: 700,
            }}
          >
            {showName}
          </p>
          <h2
            style={{
              margin: `${scaleFont(10, width)}px 0 0`,
              color: "#fafafa",
              fontSize: scaleFont(52, width),
              fontWeight: 800,
              lineHeight: 1.08,
              maxWidth: width * 0.78,
            }}
          >
            {episodeTitle}
          </h2>
        </div>
      </FadeIn>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${breathe})`,
        }}
      >
        <AudioPulse src={audioSrc} size={pulseSize} color={COLORS.accent} ringCount={3} />
      </div>

      <div style={{ paddingBottom: scaleFont(8, width) }}>
        <WaveformLine
          src={audioSrc}
          height={scaleFont(120, height)}
          strokeColor={COLORS.waveform}
          strokeWidth={3}
          mirror
        />
      </div>
    </AbsoluteFill>
  );
};

export const PodcastClip: React.FC<PodcastClipProps> = ({
  audioSrc,
  captions,
  title = "The moment worth sharing",
  subtitle = "Pull one quote into a vertical clip",
  showName = "Studio Sessions",
  ctaTitle,
  ctaLabel,
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <PodcastIntro title={title} subtitle={subtitle} audioSrc={audioSrc} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={110}>
        <PodcastStudio
          audioSrc={audioSrc}
          showName={showName}
          episodeTitle={title}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={90}>
        <CaptionScene
          captions={captions}
          placement="center"
          backgroundColor={COLORS.quoteBg}
          activeColor={COLORS.accent}
          mode="karaoke-scale"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <EndCard
          title={ctaTitle ?? showName}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
