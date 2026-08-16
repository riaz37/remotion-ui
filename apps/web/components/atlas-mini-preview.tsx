"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AtlasLane } from "@/lib/atlas";
import { laneAccentMuted } from "@/lib/lane-visuals";
import { previewMeta } from "@/lib/preview-config";
import { AnimatedBarChartPreview } from "./previews/animated-bar-chart";
import {
  ChatGptPreview,
  ClaudeChatPreview,
  ClaudeCodePreview,
  OpencodePreview,
  V0ComposerPreview,
} from "./previews/ai-composer-previews";
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
import { ChatToPreviewPreview } from "./previews/chat-to-preview";
import { CodeAccordionPreview } from "./previews/code-accordion";
import { CodeDiffWipePreview } from "./previews/code-diff-wipe";
import { CodeRevealPreview } from "./previews/code-reveal";
import { CommentCalloutPreview } from "./previews/comment-callout";
import { CounterPreview } from "./previews/counter";
import { CreatorReelPreview } from "./previews/creator-reel";
import { CursorPathPreview } from "./previews/cursor-path";
import { DataFlowPipesPreview } from "./previews/data-flow-pipes";
import { DataStoryPreview } from "./previews/data-story";
import { DragDropFlowPreview } from "./previews/drag-drop-flow";
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
import { SplitTextCharsPreview } from "./previews/split-text-chars";
import { AudioReactiveScalePreview } from "./previews/audio-reactive-scale";
import { SrtCaptionTrackPreview } from "./previews/srt-caption-track";
import { SpringInPreview } from "./previews/spring-in";
import { StaggerChildrenPreview } from "./previews/stagger-children";
import { StatCardPreview } from "./previews/stat-card";
import { TerminalSimulatorPreview } from "./previews/terminal-simulator";
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
import { ConfettiBurstPreview } from "./previews/confetti-burst";
import { DeviceMockupZoomPreview } from "./previews/device-mockup-zoom";
import { DynamicGridPreview } from "./previews/dynamic-grid";
import { MeshGradientBgPreview } from "./previews/mesh-gradient-bg";
import { SimulatedCursorPreview } from "./previews/simulated-cursor";
import { TransitionBlurRevealPreview } from "./previews/transition-blur-reveal";
import { TransitionChromaticAberrationWipePreview } from "./previews/transition-chromatic-aberration-wipe";
import { TransitionDirectionalWipePreview } from "./previews/transition-directional-wipe";
import { TransitionFrostedGlassWipePreview } from "./previews/transition-frosted-glass-wipe";
import { TransitionCircleRevealPreview } from "./previews/transition-circle-reveal";
import { TransitionCardFlipPreview } from "./previews/transition-card-flip";
import { TransitionBlindsPreview } from "./previews/transition-blinds";
import { TransitionWhipPanPreview } from "./previews/transition-whip-pan";
import { TransitionMorphShapePreview } from "./previews/transition-morph-shape";
import { TransitionLiquidWarpPreview } from "./previews/transition-liquid-warp";
import { TransitionGridPixelateWipePreview } from "./previews/transition-grid-pixelate-wipe";
import { TransitionSpatialPushPreview } from "./previews/transition-spatial-push";
import { TransitionZoomThroughPreview } from "./previews/transition-zoom-through";
import { TutorialClipPreview } from "./previews/tutorial-clip";
import { TypewriterPreview } from "./previews/typewriter";
import {
  AiComposerShowcasePreview,
  AiGenerationCanvasPreview,
  BentoPanPreview,
  BrowserFlowPreview,
  DashboardPopulatePreview,
  DeployRevealPreview,
  EcosystemOrbitPreview,
  HeroDeviceAssemblePreview,
  ImageExpandPreview,
  LandingCodeShowcasePreview,
  LiveCodeSplitPreview,
  PricingFocusPreview,
  ToolMenuSlidePreview,
} from "./previews/wave-batch-previews";
import { WaveformLinePreview } from "./previews/waveform-line";
import { MarkerHighlightPreview } from "./previews/marker-highlight";
import { ZoomPanFramePreview } from "./previews/zoom-pan-frame";
import { SkewInPreview } from "./previews/skew-in";
import { ScrambleTextPreview } from "./previews/scramble-text";
import { TextMaskVideoPreview } from "./previews/text-mask-video";
import { HandwritingTextPreview } from "./previews/handwriting-text";
import { StrokeToFillTextPreview } from "./previews/stroke-to-fill-text";
import { VariableFontMorphPreview } from "./previews/variable-font-morph";
import { LiquidTextMorphPreview } from "./previews/liquid-text-morph";
import { WaveTextPreview } from "./previews/wave-text";
import { NeonFlickerTextPreview } from "./previews/neon-flicker-text";
import { AuroraBgPreview } from "./previews/aurora-bg";
import { ParticleFieldPreview } from "./previews/particle-field";
import { TopographicLinesBgPreview } from "./previews/topographic-lines-bg";
import { CausticsBgPreview } from "./previews/caustics-bg";
import { AnimatedNoiseGrainPreview } from "./previews/animated-noise-grain";
import { LightRaysPreview } from "./previews/light-rays";
import { ParallaxLayersPreview } from "./previews/parallax-layers";
import { ShakeEmphasisPreview } from "./previews/shake-emphasis";
import { GlowPulsePreview } from "./previews/glow-pulse";
import { MotionTrailPreview } from "./previews/motion-trail";
import { SquashStretchPreview } from "./previews/squash-stretch";
import { OrbitMotionPreview } from "./previews/orbit-motion";
import { DepthOfFieldBlurPreview } from "./previews/depth-of-field-blur";
import { ScanlineCrtPreview } from "./previews/scanline-crt";
import { BarChartRacePreview } from "./previews/bar-chart-race";
import { DonutChartPreview } from "./previews/donut-chart";
import { PieSliceRevealPreview } from "./previews/pie-slice-reveal";
import { ScatterPlotPopPreview } from "./previews/scatter-plot-pop";
import { BubbleChartPackPreview } from "./previews/bubble-chart-pack";
import { GaugeDialPreview } from "./previews/gauge-dial";
import { SparklineRowPreview } from "./previews/sparkline-row";
import { HeatmapGridPreview } from "./previews/heatmap-grid";
import { ComparisonBarsPreview } from "./previews/comparison-bars";
import { FunnelChartPreview } from "./previews/funnel-chart";
import { RadarChartPreview } from "./previews/radar-chart";
import { TreemapBlocksPreview } from "./previews/treemap-blocks";
import { WaterfallChartPreview } from "./previews/waterfall-chart";
import { StackedAreaChartPreview } from "./previews/stacked-area-chart";
import { CandlestickChartPreview } from "./previews/candlestick-chart";
import { GanttTimelinePreview } from "./previews/gantt-timeline";
import { WordPopCaptionsPreview } from "./previews/word-pop-captions";
import { CaptionEmojiBeatPreview } from "./previews/caption-emoji-beat";
import { SpeakerLabelCaptionsPreview } from "./previews/speaker-label-captions";
import { TranscriptScrollPreview } from "./previews/transcript-scroll";
import { SubtitleTranslatePreview } from "./previews/subtitle-translate";
import { WaveformBarsRadialPreview } from "./previews/waveform-bars-radial";
import { VuMeterPreview } from "./previews/vu-meter";
import { VoiceNoteBubblePreview } from "./previews/voice-note-bubble";
import { BeatPulseGridPreview } from "./previews/beat-pulse-grid";
import { AudioScrubberPreview } from "./previews/audio-scrubber";
import { PollOverlayPreview } from "./previews/poll-overlay";
import { ReactionBurstPreview } from "./previews/reaction-burst";
import { CountdownTimerPreview } from "./previews/countdown-timer";
import { SportsScorebugPreview } from "./previews/sports-scorebug";
import { NewsTickerBarPreview } from "./previews/news-ticker-bar";
import { FormFillSequencePreview } from "./previews/form-fill-sequence";
import { NotificationStackPreview } from "./previews/notification-stack";
import { TabSwitchPanelPreview } from "./previews/tab-switch-panel";
import { SearchResultsPopulatePreview } from "./previews/search-results-populate";
import { FileTreeRevealPreview } from "./previews/file-tree-reveal";
import { KanbanMovePreview } from "./previews/kanban-move";
import { CommitGraphPreview } from "./previews/commit-graph";
import { ComparisonTablePreview } from "./previews/comparison-table";
import { PricingCardPreview } from "./previews/pricing-card";
import { FaqAccordionPreview } from "./previews/faq-accordion";
import { TeamGridPreview } from "./previews/team-grid";
import { LogoWallPreview } from "./previews/logo-wall";
import { ChangelogEntryPreview } from "./previews/changelog-entry";
import { RoadmapLanesPreview } from "./previews/roadmap-lanes";
import { OrgChartBuildPreview } from "./previews/org-chart-build";
import { QuizQuestionPreview } from "./previews/quiz-question";
import { WeatherCardPreview } from "./previews/weather-card";
import { CalendarMonthFillPreview } from "./previews/calendar-month-fill";
import { ArrowAnnotatePreview } from "./previews/arrow-annotate";
import { BadgeStampPreview } from "./previews/badge-stamp";

type AtlasMiniPreviewProps = {
  slug: string;
  lane: AtlasLane;
  /** Enable hover scrub on filmstrip cards */
  scrubOnHover?: boolean;
  /**
   * Only run the player while it is on screen. Sections that mount many
   * previews at once (the contact sheet, the docs grids) use this so offscreen
   * compositions are not burning frames.
   */
  playWhenVisible?: boolean;
  aspectRatio?: "16 / 9" | "9 / 16";
};

const PREVIEWS: Record<string, React.ComponentType> = {
  "animated-bar-chart": AnimatedBarChartPreview,
  "audio-pulse": AudioPulsePreview,
  "audiogram-bars": AudiogramBarsPreview,
  "audiogram-scene": AudiogramScenePreview,
  "auto-fit-title": AutoFitTitlePreview,
  "b-roll-stack": BRollStackPreview,
  "blur-in": BlurInPreview,
  "callout-spotlight": CalloutSpotlightPreview,
  "caption-bumper": CaptionBumperPreview,
  "caption-highlight": CaptionHighlightPreview,
  "caption-scene": CaptionScenePreview,
  "chat-to-preview": ChatToPreviewPreview,
  "claude-chat": ClaudeChatPreview,
  "chat-gpt": ChatGptPreview,
  v0: V0ComposerPreview,
  "claude-code": ClaudeCodePreview,
  opencode: OpencodePreview,
  "code-accordion": CodeAccordionPreview,
  "code-diff-wipe": CodeDiffWipePreview,
  "code-reveal": CodeRevealPreview,
  "comment-callout": CommentCalloutPreview,
  counter: CounterPreview,
  "creator-reel": CreatorReelPreview,
  "cursor-path": CursorPathPreview,
  "data-flow-pipes": DataFlowPipesPreview,
  "data-story": DataStoryPreview,
  "drag-drop-flow": DragDropFlowPreview,
  "end-card": EndCardPreview,
  "fade-in": FadeInPreview,
  "fade-out": FadeOutPreview,
  "feature-list": FeatureListPreview,
  "hero-loop": HeroLoopPreview,
  "hero-device-assemble": HeroDeviceAssemblePreview,
  "ecosystem-orbit": EcosystemOrbitPreview,
  "bento-pan": BentoPanPreview,
  "browser-flow": BrowserFlowPreview,
  "ai-generation-canvas": AiGenerationCanvasPreview,
  "ai-composer-showcase": AiComposerShowcasePreview,
  "live-code-split": LiveCodeSplitPreview,
  "deploy-reveal": DeployRevealPreview,
  "dashboard-populate": DashboardPopulatePreview,
  "pricing-focus": PricingFocusPreview,
  "landing-code-showcase": LandingCodeShowcasePreview,
  "tool-menu-slide": ToolMenuSlidePreview,
  "image-expand": ImageExpandPreview,
  "hook-card": HookCardPreview,
  intro: IntroPreview,
  "karaoke-captions": KaraokeCaptionsPreview,
  "line-chart-draw": LineChartDrawPreview,
  "logo-reveal": LogoRevealPreview,
  "lower-third": LowerThirdPreview,
  "map-canvas": MapCanvasPreview,
  "map-flight": MapFlightPreview,
  "map-markers": MapMarkersPreview,
  "map-route": MapRoutePreview,
  "media-frame": MediaFramePreview,
  "media-sequence": MediaSequencePreview,
  "metric-ticker": MetricTickerPreview,
  "path-draw": PathDrawPreview,
  "podcast-clip": PodcastClipPreview,
  "progress-bar": ProgressBarPreview,
  "quote-card": QuoteCardPreview,
  "rotate-in": RotateInPreview,
  "scale-in": ScaleInPreview,
  showcase: ShowcasePreview,
  "slide-left": SlideLeftPreview,
  "slide-up": SlideUpPreview,
  "social-clip": SocialClipPreview,
  "split-screen": SplitScreenPreview,
  "split-text-chars": SplitTextCharsPreview,
  "audio-reactive-scale": AudioReactiveScalePreview,
  "srt-caption-track": SrtCaptionTrackPreview,
  "spring-in": SpringInPreview,
  "stagger-children": StaggerChildrenPreview,
  "stat-card": StatCardPreview,
  "terminal-simulator": TerminalSimulatorPreview,
  "timeline-steps": TimelineStepsPreview,
  "title-card": TitleCardPreview,
  "talking-head-layout": TalkingHeadLayoutPreview,
  "transition-clock-wipe": TransitionClockWipePreview,
  "transition-fade": TransitionFadePreview,
  "transition-light-leak": TransitionLightLeakPreview,
  "transition-slide": TransitionSlidePreview,
  "transition-wipe": TransitionWipePreview,
  "blur-reveal": TransitionBlurRevealPreview,
  "chromatic-aberration-wipe": TransitionChromaticAberrationWipePreview,
  "confetti-burst": ConfettiBurstPreview,
  "device-mockup-zoom": DeviceMockupZoomPreview,
  "directional-wipe": TransitionDirectionalWipePreview,
  "dynamic-grid": DynamicGridPreview,
  "grid-pixelate-wipe": TransitionGridPixelateWipePreview,
  "frosted-glass-wipe": TransitionFrostedGlassWipePreview,
  "transition-circle-reveal": TransitionCircleRevealPreview,
  "transition-card-flip": TransitionCardFlipPreview,
  "transition-blinds": TransitionBlindsPreview,
  "transition-whip-pan": TransitionWhipPanPreview,
  "transition-morph-shape": TransitionMorphShapePreview,
  "transition-liquid-warp": TransitionLiquidWarpPreview,
  "mesh-gradient-bg": MeshGradientBgPreview,
  "simulated-cursor": SimulatedCursorPreview,
  "spatial-push": TransitionSpatialPushPreview,
  "zoom-through": TransitionZoomThroughPreview,
  "tutorial-clip": TutorialClipPreview,
  typewriter: TypewriterPreview,
  "waveform-line": WaveformLinePreview,
  "marker-highlight": MarkerHighlightPreview,
  "zoom-pan-frame": ZoomPanFramePreview,
  "skew-in": SkewInPreview,
  "scramble-text": ScrambleTextPreview,
  "text-mask-video": TextMaskVideoPreview,
  "handwriting-text": HandwritingTextPreview,
  "stroke-to-fill-text": StrokeToFillTextPreview,
  "variable-font-morph": VariableFontMorphPreview,
  "liquid-text-morph": LiquidTextMorphPreview,
  "wave-text": WaveTextPreview,
  "neon-flicker-text": NeonFlickerTextPreview,
  "aurora-bg": AuroraBgPreview,
  "particle-field": ParticleFieldPreview,
  "topographic-lines-bg": TopographicLinesBgPreview,
  "caustics-bg": CausticsBgPreview,
  "animated-noise-grain": AnimatedNoiseGrainPreview,
  "light-rays": LightRaysPreview,
  "parallax-layers": ParallaxLayersPreview,
  "shake-emphasis": ShakeEmphasisPreview,
  "glow-pulse": GlowPulsePreview,
  "motion-trail": MotionTrailPreview,
  "squash-stretch": SquashStretchPreview,
  "orbit-motion": OrbitMotionPreview,
  "depth-of-field-blur": DepthOfFieldBlurPreview,
  "scanline-crt": ScanlineCrtPreview,
  "bar-chart-race": BarChartRacePreview,
  "donut-chart": DonutChartPreview,
  "pie-slice-reveal": PieSliceRevealPreview,
  "scatter-plot-pop": ScatterPlotPopPreview,
  "bubble-chart-pack": BubbleChartPackPreview,
  "gauge-dial": GaugeDialPreview,
  "sparkline-row": SparklineRowPreview,
  "heatmap-grid": HeatmapGridPreview,
  "comparison-bars": ComparisonBarsPreview,
  "funnel-chart": FunnelChartPreview,
  "radar-chart": RadarChartPreview,
  "treemap-blocks": TreemapBlocksPreview,
  "waterfall-chart": WaterfallChartPreview,
  "stacked-area-chart": StackedAreaChartPreview,
  "candlestick-chart": CandlestickChartPreview,
  "gantt-timeline": GanttTimelinePreview,
  "word-pop-captions": WordPopCaptionsPreview,
  "caption-emoji-beat": CaptionEmojiBeatPreview,
  "speaker-label-captions": SpeakerLabelCaptionsPreview,
  "transcript-scroll": TranscriptScrollPreview,
  "subtitle-translate": SubtitleTranslatePreview,
  "waveform-bars-radial": WaveformBarsRadialPreview,
  "vu-meter": VuMeterPreview,
  "voice-note-bubble": VoiceNoteBubblePreview,
  "beat-pulse-grid": BeatPulseGridPreview,
  "audio-scrubber": AudioScrubberPreview,
  "poll-overlay": PollOverlayPreview,
  "reaction-burst": ReactionBurstPreview,
  "countdown-timer": CountdownTimerPreview,
  "sports-scorebug": SportsScorebugPreview,
  "news-ticker-bar": NewsTickerBarPreview,
  "form-fill-sequence": FormFillSequencePreview,
  "notification-stack": NotificationStackPreview,
  "tab-switch-panel": TabSwitchPanelPreview,
  "search-results-populate": SearchResultsPopulatePreview,
  "file-tree-reveal": FileTreeRevealPreview,
  "kanban-move": KanbanMovePreview,
  "commit-graph": CommitGraphPreview,
  "comparison-table": ComparisonTablePreview,
  "pricing-card": PricingCardPreview,
  "faq-accordion": FaqAccordionPreview,
  "team-grid": TeamGridPreview,
  "logo-wall": LogoWallPreview,
  "changelog-entry": ChangelogEntryPreview,
  "roadmap-lanes": RoadmapLanesPreview,
  "org-chart-build": OrgChartBuildPreview,
  "quiz-question": QuizQuestionPreview,
  "weather-card": WeatherCardPreview,
  "calendar-month-fill": CalendarMonthFillPreview,
  "arrow-annotate": ArrowAnnotatePreview,
  "badge-stamp": BadgeStampPreview,
};


export function AtlasMiniPreview({
  slug,
  lane,
  scrubOnHover = false,
  playWhenVisible = false,
  aspectRatio,
}: AtlasMiniPreviewProps) {
  const component = PREVIEWS[slug];

  if (!component) {
    return <DesignedFallback slug={slug} lane={lane} aspectRatio={aspectRatio} />;
  }

  return (
    <LivePreview
      slug={slug}
      component={component}
      scrubOnHover={scrubOnHover}
      playWhenVisible={playWhenVisible}
      aspectRatio={aspectRatio}
    />
  );
}

function LivePreview({
  slug,
  component,
  scrubOnHover,
  playWhenVisible = false,
  aspectRatio: aspectRatioProp,
}: {
  slug: string;
  component: React.ComponentType;
  scrubOnHover: boolean;
  playWhenVisible?: boolean;
  aspectRatio?: "16 / 9" | "9 / 16";
}) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height, durationInFrames: duration } = previewMeta(slug);
  const aspectRatio =
    aspectRatioProp ?? (height > width ? "9 / 16" : "16 / 9");

  // Some previews (audiogram, waveform, …) read browser-only audio data
  // synchronously on their first client render, which never matches the
  // server's placeholder markup. Deferring the Player to a post-mount
  // effect keeps it out of SSR output entirely, so there's nothing for
  // hydration to mismatch against.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(0);

    if (!playWhenVisible) {
      const id = window.requestAnimationFrame(() => player.play());
      return () => window.cancelAnimationFrame(id);
    }

    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const current = playerRef.current;
        if (!current) return;
        if (entry.isIntersecting) {
          current.play();
        } else {
          current.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [playWhenVisible]);

  const handleScrub = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubOnHover || !containerRef.current || !playerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width),
      );
      const frame = Math.floor(ratio * (duration - 1));
      playerRef.current.pause();
      playerRef.current.seekTo(frame);
    },
    [scrubOnHover, duration],
  );

  const handleLeave = useCallback(() => {
    if (!scrubOnHover || !playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
  }, [scrubOnHover]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[var(--bay-stage)]"
      style={{ aspectRatio }}
      onMouseMove={scrubOnHover ? handleScrub : undefined}
      onMouseLeave={scrubOnHover ? handleLeave : undefined}
    >
      {mounted ? (
        <Player
          ref={playerRef}
          component={component}
          durationInFrames={duration}
          fps={30}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: "100%", height: "100%", display: "block" }}
          controls={false}
          loop
          autoPlay={!playWhenVisible}
          clickToPlay={false}
          initiallyMuted
          showPosterWhenUnplayed={false}
          acknowledgeRemotionLicense
        />
      ) : null}
    </div>
  );
}

function DesignedFallback({
  slug,
  lane,
  aspectRatio = "16 / 9",
}: {
  slug: string;
  lane: AtlasLane;
  aspectRatio?: "16 / 9" | "9 / 16";
}) {
  const muted = laneAccentMuted(lane);
  const label = slug
    .split("-")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative w-full overflow-hidden bg-[var(--bay-stage)]"
      style={{ aspectRatio }}
    >
      <div
        className="absolute inset-x-5 bottom-5 h-1 overflow-hidden rounded-full bg-white/10"
      >
        <div className="h-full w-2/3 rounded-full bg-[var(--bay-phosphor)]" />
      </div>
      <div
        className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border text-sm font-medium text-fd-muted-foreground"
        style={{ borderColor: muted, background: "rgb(255 255 255 / 0.03)" }}
      >
        {label}
      </div>
    </div>
  );
}
