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

/**
 * Beat order: intro → caption → studio → end card.
 *
 * The caption beat sits *second*, and keeps the longer 110-frame slot, because
 * the 15/50/90% preview samples otherwise never land on it: with the caption
 * third, the 50% sample fell inside the fade into the studio beat. With this
 * order the samples land at frames 44 (intro), 147 (caption) and 264 (end card).
 *
 * Duration math: 70 + 110 + 90 + 60 − 3 × 12 (fade) = 294.
 * Mirrored in `lib/preview-config.ts` and `registry.json`.
 */
const SCENE_DURATIONS = {
  intro: 70,
  caption: 110,
  studio: 90,
  end: 60,
} as const;

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

/**
 * The studio frame: show header, a centre slot, and the waveform along the
 * foot. The caption beat reuses it with the caption in the centre slot —
 * captions on a bare plate left ~85% of a 1080×1920 frame empty, which is the
 * D2 failure the audit caught at the 50% sample.
 */
const PodcastStudio: React.FC<{
  audioSrc: string;
  showName: string;
  episodeTitle: string;
  /** Fills the centre slot instead of the audio pulse. */
  center?: React.ReactNode;
}> = ({ audioSrc, showName, episodeTitle, center }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  // The pulse was ~90px in a 540-wide frame and left the middle of the clip
  // empty; 1.8× fills the mid band. The waveform is inset so it terminates
  // inside the frame instead of running off both edges.
  const pulseSize = scaleFont(360, width);
  const waveformInset = scaleFont(48, width);
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
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: center ? undefined : `${breathe}`,
        }}
      >
        {center ?? (
          <AudioPulse
            src={audioSrc}
            size={pulseSize}
            color={COLORS.accent}
            ringCount={3}
          />
        )}
      </div>

      <div
        style={{
          paddingBottom: scaleFont(8, width),
          paddingLeft: waveformInset,
          paddingRight: waveformInset,
        }}
      >
        <WaveformLine
          src={audioSrc}
          width={
            width -
            safeArea.paddingLeft -
            safeArea.paddingRight -
            waveformInset * 2
          }
          height={scaleFont(216, height)}
          strokeColor={COLORS.waveform}
          /* The default knocked-back muted colour rendered the unplayed tail as
           * a near-black slab against the dark stage — it read as a broken
           * block rather than as the rest of the waveform. */
          mutedStrokeColor="rgba(245,158,11,0.40)"
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
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.intro}>
        <PodcastIntro title={title} subtitle={subtitle} audioSrc={audioSrc} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.caption}>
        <PodcastStudio
          audioSrc={audioSrc}
          showName={showName}
          episodeTitle={title}
          center={
            <CaptionScene
              captions={captions}
              placement="center"
              backgroundColor="transparent"
              activeColor={COLORS.accent}
              mode="karaoke-scale"
              durationInFrames={SCENE_DURATIONS.caption}
            />
          }
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.studio}>
        <PodcastStudio
          audioSrc={audioSrc}
          showName={showName}
          episodeTitle={title}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
        <EndCard
          title={ctaTitle ?? showName}
          cta={ctaLabel}
          backgroundColor={COLORS.endBg}
          accentColor={COLORS.endAccent}
          /* The end card's beat plan runs ~2.7s at speed 1, which does not fit
           * a 60-frame slot: the 90% sample landed while the button label was
           * still rising out of the pill and read as clipped type. */
          speed={1.6}
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
