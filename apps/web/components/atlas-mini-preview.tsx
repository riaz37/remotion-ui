"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, type ComponentType } from "react";
import type { AtlasLane } from "@/lib/atlas";
import { laneAccent, laneAccentMuted } from "@/lib/lane-visuals";
import { AnimatedBarChartPreview } from "./previews/animated-bar-chart";
import { AudioPulsePreview } from "./previews/audio-pulse";
import { AudiogramBarsPreview } from "./previews/audiogram-bars";
import { AudiogramScenePreview } from "./previews/audiogram-scene";
import { AutoFitTitlePreview } from "./previews/auto-fit-title";
import { BRollStackPreview } from "./previews/b-roll-stack";
import { BlurInPreview } from "./previews/blur-in";
import { CalloutSpotlightPreview } from "./previews/callout-spotlight";
import { CaptionBumperPreview } from "./previews/caption-bumper";
import { CaptionHighlightPreview } from "./previews/caption-highlight";
import { CaptionScenePreview } from "./previews/caption-scene";
import { CodeRevealPreview } from "./previews/code-reveal";
import { CommentCalloutPreview } from "./previews/comment-callout";
import { CounterPreview } from "./previews/counter";
import { CreatorReelPreview } from "./previews/creator-reel";
import { CursorPathPreview } from "./previews/cursor-path";
import { DataStoryPreview } from "./previews/data-story";
import { EndCardPreview } from "./previews/end-card";
import { FadeInPreview } from "./previews/fade-in";
import { FadeOutPreview } from "./previews/fade-out";
import { FeatureListPreview } from "./previews/feature-list";
import { HeroLoopPreview } from "./previews/hero-loop";
import { HookCardPreview } from "./previews/hook-card";
import { IntroPreview } from "./previews/intro";
import { KaraokeCaptionsPreview } from "./previews/karaoke-captions";
import { LineChartDrawPreview } from "./previews/line-chart-draw";
import { LogoRevealPreview } from "./previews/logo-reveal";
import { LowerThirdPreview } from "./previews/lower-third";
import {
  MapCanvasPreview,
  MapMarkersPreview,
  MapRoutePreview,
} from "./previews/map-primitive-previews";
import { MapFlightPreview } from "./previews/map-flight";
import { MediaFramePreview } from "./previews/media-frame";
import { MediaSequencePreview } from "./previews/media-sequence";
import { MetricTickerPreview } from "./previews/metric-ticker";
import { PathDrawPreview } from "./previews/path-draw";
import { PodcastClipPreview } from "./previews/podcast-clip";
import { ProgressBarPreview } from "./previews/progress-bar";
import { QuoteCardPreview } from "./previews/quote-card";
import { RotateInPreview } from "./previews/rotate-in";
import { ScaleInPreview } from "./previews/scale-in";
import { ShowcasePreview } from "./previews/showcase";
import { SlideLeftPreview } from "./previews/slide-left";
import { SlideUpPreview } from "./previews/slide-up";
import { SocialClipPreview } from "./previews/social-clip";
import { SplitScreenPreview } from "./previews/split-screen";
import { SpringInPreview } from "./previews/spring-in";
import { StaggerChildrenPreview } from "./previews/stagger-children";
import { StatCardPreview } from "./previews/stat-card";
import { TimelineStepsPreview } from "./previews/timeline-steps";
import { TitleCardPreview } from "./previews/title-card";
import { TalkingHeadLayoutPreview } from "./previews/talking-head-layout";
import {
  TransitionClockWipePreview,
  TransitionFadePreview,
  TransitionLightLeakPreview,
  TransitionSlidePreview,
  TransitionWipePreview,
} from "./previews/transition-previews";
import { TutorialClipPreview } from "./previews/tutorial-clip";
import { TypewriterPreview } from "./previews/typewriter";
import { WaveformLinePreview } from "./previews/waveform-line";
import { WordHighlightPreview } from "./previews/word-highlight";
import { ZoomPanFramePreview } from "./previews/zoom-pan-frame";

type AtlasMiniPreviewProps = {
  slug: string;
  lane: AtlasLane;
};

type PreviewConfig = {
  component: ComponentType;
  durationInFrames?: number;
};

const PREVIEWS: Record<string, PreviewConfig> = {
  "animated-bar-chart": { component: AnimatedBarChartPreview },
  "audio-pulse": { component: AudioPulsePreview, durationInFrames: 120 },
  "audiogram-bars": { component: AudiogramBarsPreview, durationInFrames: 120 },
  "audiogram-scene": { component: AudiogramScenePreview, durationInFrames: 150 },
  "auto-fit-title": { component: AutoFitTitlePreview },
  "b-roll-stack": { component: BRollStackPreview },
  "blur-in": { component: BlurInPreview },
  "callout-spotlight": { component: CalloutSpotlightPreview },
  "caption-bumper": { component: CaptionBumperPreview },
  "caption-highlight": { component: CaptionHighlightPreview },
  "caption-scene": { component: CaptionScenePreview, durationInFrames: 150 },
  "code-reveal": { component: CodeRevealPreview },
  "comment-callout": { component: CommentCalloutPreview },
  counter: { component: CounterPreview },
  "creator-reel": { component: CreatorReelPreview, durationInFrames: 180 },
  "cursor-path": { component: CursorPathPreview },
  "data-story": { component: DataStoryPreview, durationInFrames: 180 },
  "end-card": { component: EndCardPreview },
  "fade-in": { component: FadeInPreview },
  "fade-out": { component: FadeOutPreview },
  "feature-list": { component: FeatureListPreview },
  "hero-loop": { component: HeroLoopPreview, durationInFrames: 180 },
  "hook-card": { component: HookCardPreview },
  intro: { component: IntroPreview, durationInFrames: 150 },
  "karaoke-captions": { component: KaraokeCaptionsPreview },
  "line-chart-draw": { component: LineChartDrawPreview },
  "logo-reveal": { component: LogoRevealPreview },
  "lower-third": { component: LowerThirdPreview },
  "map-canvas": { component: MapCanvasPreview },
  "map-flight": { component: MapFlightPreview, durationInFrames: 150 },
  "map-markers": { component: MapMarkersPreview },
  "map-route": { component: MapRoutePreview },
  "media-frame": { component: MediaFramePreview },
  "media-sequence": { component: MediaSequencePreview },
  "metric-ticker": { component: MetricTickerPreview },
  "path-draw": { component: PathDrawPreview },
  "podcast-clip": { component: PodcastClipPreview, durationInFrames: 180 },
  "progress-bar": { component: ProgressBarPreview },
  "quote-card": { component: QuoteCardPreview },
  "rotate-in": { component: RotateInPreview },
  "scale-in": { component: ScaleInPreview },
  showcase: { component: ShowcasePreview, durationInFrames: 150 },
  "slide-left": { component: SlideLeftPreview },
  "slide-up": { component: SlideUpPreview },
  "social-clip": { component: SocialClipPreview, durationInFrames: 180 },
  "split-screen": { component: SplitScreenPreview },
  "spring-in": { component: SpringInPreview },
  "stagger-children": { component: StaggerChildrenPreview },
  "stat-card": { component: StatCardPreview },
  "timeline-steps": { component: TimelineStepsPreview },
  "title-card": { component: TitleCardPreview },
  "talking-head-layout": { component: TalkingHeadLayoutPreview },
  "transition-clock-wipe": { component: TransitionClockWipePreview },
  "transition-fade": { component: TransitionFadePreview },
  "transition-light-leak": { component: TransitionLightLeakPreview },
  "transition-slide": { component: TransitionSlidePreview },
  "transition-wipe": { component: TransitionWipePreview },
  "tutorial-clip": { component: TutorialClipPreview, durationInFrames: 180 },
  typewriter: { component: TypewriterPreview },
  "waveform-line": { component: WaveformLinePreview },
  "word-highlight": { component: WordHighlightPreview },
  "zoom-pan-frame": { component: ZoomPanFramePreview },
};

export function AtlasMiniPreview({ slug, lane }: AtlasMiniPreviewProps) {
  const preview = PREVIEWS[slug];

  if (!preview) {
    return <DesignedFallback slug={slug} lane={lane} />;
  }

  return <LivePreview preview={preview} />;
}

function LivePreview({ preview }: { preview: PreviewConfig }) {
  const playerRef = useRef<PlayerRef>(null);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(0);
    const id = window.requestAnimationFrame(() => player.play());
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-[var(--brand-stage)]">
      <Player
        ref={playerRef}
        component={preview.component}
        durationInFrames={preview.durationInFrames ?? 120}
        fps={30}
        compositionWidth={960}
        compositionHeight={540}
        style={{ width: "100%", display: "block" }}
        controls={false}
        loop
        autoPlay
        clickToPlay={false}
        initiallyMuted
        showPosterWhenUnplayed={false}
        acknowledgeRemotionLicense
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgb(255_255_255_/_0.10),transparent_34%),linear-gradient(to_top,rgb(0_0_0_/_0.22),transparent_45%)]" />
    </div>
  );
}

function DesignedFallback({ slug, lane }: AtlasMiniPreviewProps) {
  const accent = laneAccent(lane);
  const muted = laneAccentMuted(lane);
  const label = useMemo(
    () =>
      slug
        .split("-")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [slug],
  );

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-lg border border-white/10"
      style={{
        background: `radial-gradient(circle at 25% 20%, ${muted}, transparent 38%), linear-gradient(135deg, #08111f, #121827)`,
      }}
    >
      <div className="absolute inset-x-5 bottom-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-2/3 rounded-full"
          style={{ background: accent }}
        />
      </div>
      <div
        className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-lg font-semibold"
        style={{
          borderColor: accent,
          color: accent,
          background: "rgb(255 255 255 / 0.05)",
          boxShadow: `0 0 48px ${muted}`,
        }}
      >
        {label}
      </div>
    </div>
  );
}
