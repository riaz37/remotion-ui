import type { Caption } from "@remotion/captions";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { AudioPulse } from "@/remotion/primitives/audio-pulse";
import { WaveformLine } from "@/remotion/primitives/waveform-line";
import { AudiogramScene } from "@/remotion/scenes/audiogram-scene";
import { CaptionScene } from "@/remotion/scenes/caption-scene";
import { EndCard } from "@/remotion/scenes/end-card";

export type PodcastClipProps = {
  audioSrc: string;
  captions: Caption[];
  title?: string;
  subtitle?: string;
  ctaTitle?: string;
  ctaLabel?: string;
};

const fade = transitionFade({ durationInFrames: 12 });

export const PodcastClip: React.FC<PodcastClipProps> = ({
  audioSrc,
  captions,
  title = "Podcast highlight",
  subtitle = "A clip ready for social",
  ctaTitle = "Audio Cut",
  ctaLabel = "Make audio visual",
}) => (
  <AbsoluteFill style={{ backgroundColor: "#020617" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <AbsoluteFill style={{ backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <AudioPulse src={audioSrc} />
          <div style={{ color: "white", fontSize: 64, fontWeight: 900, fontFamily: "system-ui, sans-serif" }}>{title}</div>
          <div style={{ color: "#60a5fa", fontSize: 34, fontFamily: "system-ui, sans-serif" }}>{subtitle}</div>
        </AbsoluteFill>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={110}>
        <AbsoluteFill>
          <AudiogramScene src={audioSrc} title={title} backgroundColor="#0f172a" />
          <AbsoluteFill style={{ justifyContent: "flex-end", padding: 72, display: "flex" }}>
            <WaveformLine src={audioSrc} height={120} mirror />
          </AbsoluteFill>
        </AbsoluteFill>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={90}>
        <CaptionScene captions={captions} placement="center" backgroundColor="#020617" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...fade} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <EndCard title={ctaTitle} cta={ctaLabel} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
