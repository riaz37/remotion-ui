"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import type { AtlasLane } from "@/lib/atlas";
import { laneAccentMuted } from "@/lib/lane-visuals";
import { previewMeta } from "@/lib/preview-config";
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
  /**
   * When the live Player mounts. "near": as the card nears the viewport.
   * "hover": the poster stays until the card is hovered (grids of cards).
   */
  mountOn?: "near" | "hover";
  aspectRatio?: "16 / 9" | "9 / 16";
};

type PreviewLoader = () => Promise<{ default: ComponentType }>;

/**
 * One loader per slug, so each preview (and the registry component and fonts
 * it pulls in) is its own chunk. The catalog ships this table, not 167
 * components; a chunk is fetched only when its card nears the viewport.
 */
const PREVIEWS: Record<string, PreviewLoader> = {
  "animated-bar-chart": () => import("./previews/animated-bar-chart").then((m) => ({ default: m.AnimatedBarChartPreview })),
  "audio-pulse": () => import("./previews/audio-pulse").then((m) => ({ default: m.AudioPulsePreview })),
  "audiogram-bars": () => import("./previews/audiogram-bars").then((m) => ({ default: m.AudiogramBarsPreview })),
  "audiogram-scene": () => import("./previews/audiogram-scene").then((m) => ({ default: m.AudiogramScenePreview })),
  "auto-fit-title": () => import("./previews/auto-fit-title").then((m) => ({ default: m.AutoFitTitlePreview })),
  "b-roll-stack": () => import("./previews/b-roll-stack").then((m) => ({ default: m.BRollStackPreview })),
  "blur-in": () => import("./previews/blur-in").then((m) => ({ default: m.BlurInPreview })),
  "callout-spotlight": () => import("./previews/callout-spotlight").then((m) => ({ default: m.CalloutSpotlightPreview })),
  "caption-bumper": () => import("./previews/caption-bumper").then((m) => ({ default: m.CaptionBumperPreview })),
  "caption-highlight": () => import("./previews/caption-highlight").then((m) => ({ default: m.CaptionHighlightPreview })),
  "caption-scene": () => import("./previews/caption-scene").then((m) => ({ default: m.CaptionScenePreview })),
  "chat-to-preview": () => import("./previews/chat-to-preview").then((m) => ({ default: m.ChatToPreviewPreview })),
  "claude-chat": () => import("./previews/ai-composer-previews").then((m) => ({ default: m.ClaudeChatPreview })),
  "chat-gpt": () => import("./previews/ai-composer-previews").then((m) => ({ default: m.ChatGptPreview })),
  v0: () => import("./previews/ai-composer-previews").then((m) => ({ default: m.V0ComposerPreview })),
  "claude-code": () => import("./previews/ai-composer-previews").then((m) => ({ default: m.ClaudeCodePreview })),
  opencode: () => import("./previews/ai-composer-previews").then((m) => ({ default: m.OpencodePreview })),
  "code-accordion": () => import("./previews/code-accordion").then((m) => ({ default: m.CodeAccordionPreview })),
  "code-diff-wipe": () => import("./previews/code-diff-wipe").then((m) => ({ default: m.CodeDiffWipePreview })),
  "code-reveal": () => import("./previews/code-reveal").then((m) => ({ default: m.CodeRevealPreview })),
  "comment-callout": () => import("./previews/comment-callout").then((m) => ({ default: m.CommentCalloutPreview })),
  counter: () => import("./previews/counter").then((m) => ({ default: m.CounterPreview })),
  "creator-reel": () => import("./previews/creator-reel").then((m) => ({ default: m.CreatorReelPreview })),
  "cursor-path": () => import("./previews/cursor-path").then((m) => ({ default: m.CursorPathPreview })),
  "data-flow-pipes": () => import("./previews/data-flow-pipes").then((m) => ({ default: m.DataFlowPipesPreview })),
  "data-story": () => import("./previews/data-story").then((m) => ({ default: m.DataStoryPreview })),
  "drag-drop-flow": () => import("./previews/drag-drop-flow").then((m) => ({ default: m.DragDropFlowPreview })),
  "end-card": () => import("./previews/end-card").then((m) => ({ default: m.EndCardPreview })),
  "fade-in": () => import("./previews/fade-in").then((m) => ({ default: m.FadeInPreview })),
  "fade-out": () => import("./previews/fade-out").then((m) => ({ default: m.FadeOutPreview })),
  "feature-list": () => import("./previews/feature-list").then((m) => ({ default: m.FeatureListPreview })),
  "hero-loop": () => import("./previews/hero-loop").then((m) => ({ default: m.HeroLoopPreview })),
  "hero-device-assemble": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.HeroDeviceAssemblePreview })),
  "ecosystem-orbit": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.EcosystemOrbitPreview })),
  "bento-pan": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.BentoPanPreview })),
  "browser-flow": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.BrowserFlowPreview })),
  "ai-generation-canvas": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.AiGenerationCanvasPreview })),
  "ai-composer-showcase": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.AiComposerShowcasePreview })),
  "live-code-split": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.LiveCodeSplitPreview })),
  "deploy-reveal": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.DeployRevealPreview })),
  "dashboard-populate": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.DashboardPopulatePreview })),
  "pricing-focus": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.PricingFocusPreview })),
  "landing-code-showcase": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.LandingCodeShowcasePreview })),
  "tool-menu-slide": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.ToolMenuSlidePreview })),
  "image-expand": () => import("./previews/wave-batch-previews").then((m) => ({ default: m.ImageExpandPreview })),
  "hook-card": () => import("./previews/hook-card").then((m) => ({ default: m.HookCardPreview })),
  intro: () => import("./previews/intro").then((m) => ({ default: m.IntroPreview })),
  "karaoke-captions": () => import("./previews/karaoke-captions").then((m) => ({ default: m.KaraokeCaptionsPreview })),
  "line-chart-draw": () => import("./previews/line-chart-draw").then((m) => ({ default: m.LineChartDrawPreview })),
  "logo-reveal": () => import("./previews/logo-reveal").then((m) => ({ default: m.LogoRevealPreview })),
  "lower-third": () => import("./previews/lower-third").then((m) => ({ default: m.LowerThirdPreview })),
  "map-canvas": () => import("./previews/map-primitive-previews").then((m) => ({ default: m.MapCanvasPreview })),
  "map-flight": () => import("./previews/map-flight").then((m) => ({ default: m.MapFlightPreview })),
  "map-markers": () => import("./previews/map-primitive-previews").then((m) => ({ default: m.MapMarkersPreview })),
  "map-route": () => import("./previews/map-primitive-previews").then((m) => ({ default: m.MapRoutePreview })),
  "media-frame": () => import("./previews/media-frame").then((m) => ({ default: m.MediaFramePreview })),
  "media-sequence": () => import("./previews/media-sequence").then((m) => ({ default: m.MediaSequencePreview })),
  "metric-ticker": () => import("./previews/metric-ticker").then((m) => ({ default: m.MetricTickerPreview })),
  "path-draw": () => import("./previews/path-draw").then((m) => ({ default: m.PathDrawPreview })),
  "podcast-clip": () => import("./previews/podcast-clip").then((m) => ({ default: m.PodcastClipPreview })),
  "progress-bar": () => import("./previews/progress-bar").then((m) => ({ default: m.ProgressBarPreview })),
  "quote-card": () => import("./previews/quote-card").then((m) => ({ default: m.QuoteCardPreview })),
  "rotate-in": () => import("./previews/rotate-in").then((m) => ({ default: m.RotateInPreview })),
  "scale-in": () => import("./previews/scale-in").then((m) => ({ default: m.ScaleInPreview })),
  showcase: () => import("./previews/showcase").then((m) => ({ default: m.ShowcasePreview })),
  "slide-left": () => import("./previews/slide-left").then((m) => ({ default: m.SlideLeftPreview })),
  "slide-up": () => import("./previews/slide-up").then((m) => ({ default: m.SlideUpPreview })),
  "social-clip": () => import("./previews/social-clip").then((m) => ({ default: m.SocialClipPreview })),
  "split-screen": () => import("./previews/split-screen").then((m) => ({ default: m.SplitScreenPreview })),
  "split-text-chars": () => import("./previews/split-text-chars").then((m) => ({ default: m.SplitTextCharsPreview })),
  "audio-reactive-scale": () => import("./previews/audio-reactive-scale").then((m) => ({ default: m.AudioReactiveScalePreview })),
  "srt-caption-track": () => import("./previews/srt-caption-track").then((m) => ({ default: m.SrtCaptionTrackPreview })),
  "spring-in": () => import("./previews/spring-in").then((m) => ({ default: m.SpringInPreview })),
  "stagger-children": () => import("./previews/stagger-children").then((m) => ({ default: m.StaggerChildrenPreview })),
  "stat-card": () => import("./previews/stat-card").then((m) => ({ default: m.StatCardPreview })),
  "terminal-simulator": () => import("./previews/terminal-simulator").then((m) => ({ default: m.TerminalSimulatorPreview })),
  "timeline-steps": () => import("./previews/timeline-steps").then((m) => ({ default: m.TimelineStepsPreview })),
  "title-card": () => import("./previews/title-card").then((m) => ({ default: m.TitleCardPreview })),
  "talking-head-layout": () => import("./previews/talking-head-layout").then((m) => ({ default: m.TalkingHeadLayoutPreview })),
  "transition-clock-wipe": () => import("./previews/transition-previews").then((m) => ({ default: m.TransitionClockWipePreview })),
  "transition-fade": () => import("./previews/transition-previews").then((m) => ({ default: m.TransitionFadePreview })),
  "transition-light-leak": () => import("./previews/transition-previews").then((m) => ({ default: m.TransitionLightLeakPreview })),
  "transition-slide": () => import("./previews/transition-previews").then((m) => ({ default: m.TransitionSlidePreview })),
  "transition-wipe": () => import("./previews/transition-previews").then((m) => ({ default: m.TransitionWipePreview })),
  "blur-reveal": () => import("./previews/transition-blur-reveal").then((m) => ({ default: m.TransitionBlurRevealPreview })),
  "chromatic-aberration-wipe": () => import("./previews/transition-chromatic-aberration-wipe").then((m) => ({ default: m.TransitionChromaticAberrationWipePreview })),
  "confetti-burst": () => import("./previews/confetti-burst").then((m) => ({ default: m.ConfettiBurstPreview })),
  "device-mockup-zoom": () => import("./previews/device-mockup-zoom").then((m) => ({ default: m.DeviceMockupZoomPreview })),
  "directional-wipe": () => import("./previews/transition-directional-wipe").then((m) => ({ default: m.TransitionDirectionalWipePreview })),
  "dynamic-grid": () => import("./previews/dynamic-grid").then((m) => ({ default: m.DynamicGridPreview })),
  "grid-pixelate-wipe": () => import("./previews/transition-grid-pixelate-wipe").then((m) => ({ default: m.TransitionGridPixelateWipePreview })),
  "frosted-glass-wipe": () => import("./previews/transition-frosted-glass-wipe").then((m) => ({ default: m.TransitionFrostedGlassWipePreview })),
  "transition-circle-reveal": () => import("./previews/transition-circle-reveal").then((m) => ({ default: m.TransitionCircleRevealPreview })),
  "transition-card-flip": () => import("./previews/transition-card-flip").then((m) => ({ default: m.TransitionCardFlipPreview })),
  "transition-blinds": () => import("./previews/transition-blinds").then((m) => ({ default: m.TransitionBlindsPreview })),
  "transition-whip-pan": () => import("./previews/transition-whip-pan").then((m) => ({ default: m.TransitionWhipPanPreview })),
  "transition-morph-shape": () => import("./previews/transition-morph-shape").then((m) => ({ default: m.TransitionMorphShapePreview })),
  "transition-liquid-warp": () => import("./previews/transition-liquid-warp").then((m) => ({ default: m.TransitionLiquidWarpPreview })),
  "mesh-gradient-bg": () => import("./previews/mesh-gradient-bg").then((m) => ({ default: m.MeshGradientBgPreview })),
  "simulated-cursor": () => import("./previews/simulated-cursor").then((m) => ({ default: m.SimulatedCursorPreview })),
  "spatial-push": () => import("./previews/transition-spatial-push").then((m) => ({ default: m.TransitionSpatialPushPreview })),
  "zoom-through": () => import("./previews/transition-zoom-through").then((m) => ({ default: m.TransitionZoomThroughPreview })),
  "tutorial-clip": () => import("./previews/tutorial-clip").then((m) => ({ default: m.TutorialClipPreview })),
  typewriter: () => import("./previews/typewriter").then((m) => ({ default: m.TypewriterPreview })),
  "blur-focus-in": () => import("./previews/text-effects-previews").then((m) => ({ default: m.BlurFocusInPreview })),
  "staggered-fade-up": () => import("./previews/text-effects-previews").then((m) => ({ default: m.StaggeredFadeUpPreview })),
  "masked-slide-reveal": () => import("./previews/text-effects-previews").then((m) => ({ default: m.MaskedSlideRevealPreview })),
  "tracking-in": () => import("./previews/text-effects-previews").then((m) => ({ default: m.TrackingInPreview })),
  "light-sweep-text": () => import("./previews/text-effects-previews").then((m) => ({ default: m.LightSweepTextPreview })),
  "slot-roll": () => import("./previews/text-effects-previews").then((m) => ({ default: m.SlotRollPreview })),
  "matrix-decode": () => import("./previews/text-effects-previews").then((m) => ({ default: m.MatrixDecodePreview })),
  "rgb-glitch-text": () => import("./previews/text-effects-previews").then((m) => ({ default: m.RgbGlitchTextPreview })),
  "infinite-marquee": () => import("./previews/text-effects-previews").then((m) => ({ default: m.InfiniteMarqueePreview })),
  "perspective-marquee": () => import("./previews/text-effects-previews").then((m) => ({ default: m.PerspectiveMarqueePreview })),
  "waveform-line": () => import("./previews/waveform-line").then((m) => ({ default: m.WaveformLinePreview })),
  "marker-highlight": () => import("./previews/marker-highlight").then((m) => ({ default: m.MarkerHighlightPreview })),
  "zoom-pan-frame": () => import("./previews/zoom-pan-frame").then((m) => ({ default: m.ZoomPanFramePreview })),
  "skew-in": () => import("./previews/skew-in").then((m) => ({ default: m.SkewInPreview })),
  "scramble-text": () => import("./previews/scramble-text").then((m) => ({ default: m.ScrambleTextPreview })),
  "text-mask-video": () => import("./previews/text-mask-video").then((m) => ({ default: m.TextMaskVideoPreview })),
  "handwriting-text": () => import("./previews/handwriting-text").then((m) => ({ default: m.HandwritingTextPreview })),
  "stroke-to-fill-text": () => import("./previews/stroke-to-fill-text").then((m) => ({ default: m.StrokeToFillTextPreview })),
  "strikethrough-replace": () => import("./previews/strikethrough-replace").then((m) => ({ default: m.StrikethroughReplacePreview })),
  "variable-font-morph": () => import("./previews/variable-font-morph").then((m) => ({ default: m.VariableFontMorphPreview })),
  "liquid-text-morph": () => import("./previews/liquid-text-morph").then((m) => ({ default: m.LiquidTextMorphPreview })),
  "wave-text": () => import("./previews/wave-text").then((m) => ({ default: m.WaveTextPreview })),
  "neon-flicker-text": () => import("./previews/neon-flicker-text").then((m) => ({ default: m.NeonFlickerTextPreview })),
  "aurora-bg": () => import("./previews/aurora-bg").then((m) => ({ default: m.AuroraBgPreview })),
  "particle-field": () => import("./previews/particle-field").then((m) => ({ default: m.ParticleFieldPreview })),
  "topographic-lines-bg": () => import("./previews/topographic-lines-bg").then((m) => ({ default: m.TopographicLinesBgPreview })),
  "caustics-bg": () => import("./previews/caustics-bg").then((m) => ({ default: m.CausticsBgPreview })),
  "animated-noise-grain": () => import("./previews/animated-noise-grain").then((m) => ({ default: m.AnimatedNoiseGrainPreview })),
  "light-rays": () => import("./previews/light-rays").then((m) => ({ default: m.LightRaysPreview })),
  "parallax-layers": () => import("./previews/parallax-layers").then((m) => ({ default: m.ParallaxLayersPreview })),
  "shake-emphasis": () => import("./previews/shake-emphasis").then((m) => ({ default: m.ShakeEmphasisPreview })),
  "glow-pulse": () => import("./previews/glow-pulse").then((m) => ({ default: m.GlowPulsePreview })),
  "motion-trail": () => import("./previews/motion-trail").then((m) => ({ default: m.MotionTrailPreview })),
  "squash-stretch": () => import("./previews/squash-stretch").then((m) => ({ default: m.SquashStretchPreview })),
  "orbit-motion": () => import("./previews/orbit-motion").then((m) => ({ default: m.OrbitMotionPreview })),
  "depth-of-field-blur": () => import("./previews/depth-of-field-blur").then((m) => ({ default: m.DepthOfFieldBlurPreview })),
  "scanline-crt": () => import("./previews/scanline-crt").then((m) => ({ default: m.ScanlineCrtPreview })),
  "bar-chart-race": () => import("./previews/bar-chart-race").then((m) => ({ default: m.BarChartRacePreview })),
  "donut-chart": () => import("./previews/donut-chart").then((m) => ({ default: m.DonutChartPreview })),
  "pie-slice-reveal": () => import("./previews/pie-slice-reveal").then((m) => ({ default: m.PieSliceRevealPreview })),
  "scatter-plot-pop": () => import("./previews/scatter-plot-pop").then((m) => ({ default: m.ScatterPlotPopPreview })),
  "bubble-chart-pack": () => import("./previews/bubble-chart-pack").then((m) => ({ default: m.BubbleChartPackPreview })),
  "gauge-dial": () => import("./previews/gauge-dial").then((m) => ({ default: m.GaugeDialPreview })),
  "sparkline-row": () => import("./previews/sparkline-row").then((m) => ({ default: m.SparklineRowPreview })),
  "heatmap-grid": () => import("./previews/heatmap-grid").then((m) => ({ default: m.HeatmapGridPreview })),
  "comparison-bars": () => import("./previews/comparison-bars").then((m) => ({ default: m.ComparisonBarsPreview })),
  "funnel-chart": () => import("./previews/funnel-chart").then((m) => ({ default: m.FunnelChartPreview })),
  "radar-chart": () => import("./previews/radar-chart").then((m) => ({ default: m.RadarChartPreview })),
  "treemap-blocks": () => import("./previews/treemap-blocks").then((m) => ({ default: m.TreemapBlocksPreview })),
  "waterfall-chart": () => import("./previews/waterfall-chart").then((m) => ({ default: m.WaterfallChartPreview })),
  "stacked-area-chart": () => import("./previews/stacked-area-chart").then((m) => ({ default: m.StackedAreaChartPreview })),
  "candlestick-chart": () => import("./previews/candlestick-chart").then((m) => ({ default: m.CandlestickChartPreview })),
  "gantt-timeline": () => import("./previews/gantt-timeline").then((m) => ({ default: m.GanttTimelinePreview })),
  "word-pop-captions": () => import("./previews/word-pop-captions").then((m) => ({ default: m.WordPopCaptionsPreview })),
  "caption-emoji-beat": () => import("./previews/caption-emoji-beat").then((m) => ({ default: m.CaptionEmojiBeatPreview })),
  "speaker-label-captions": () => import("./previews/speaker-label-captions").then((m) => ({ default: m.SpeakerLabelCaptionsPreview })),
  "transcript-scroll": () => import("./previews/transcript-scroll").then((m) => ({ default: m.TranscriptScrollPreview })),
  "subtitle-translate": () => import("./previews/subtitle-translate").then((m) => ({ default: m.SubtitleTranslatePreview })),
  "waveform-bars-radial": () => import("./previews/waveform-bars-radial").then((m) => ({ default: m.WaveformBarsRadialPreview })),
  "vu-meter": () => import("./previews/vu-meter").then((m) => ({ default: m.VuMeterPreview })),
  "voice-note-bubble": () => import("./previews/voice-note-bubble").then((m) => ({ default: m.VoiceNoteBubblePreview })),
  "beat-pulse-grid": () => import("./previews/beat-pulse-grid").then((m) => ({ default: m.BeatPulseGridPreview })),
  "audio-scrubber": () => import("./previews/audio-scrubber").then((m) => ({ default: m.AudioScrubberPreview })),
  "poll-overlay": () => import("./previews/poll-overlay").then((m) => ({ default: m.PollOverlayPreview })),
  "reaction-burst": () => import("./previews/reaction-burst").then((m) => ({ default: m.ReactionBurstPreview })),
  "countdown-timer": () => import("./previews/countdown-timer").then((m) => ({ default: m.CountdownTimerPreview })),
  "sports-scorebug": () => import("./previews/sports-scorebug").then((m) => ({ default: m.SportsScorebugPreview })),
  "news-ticker-bar": () => import("./previews/news-ticker-bar").then((m) => ({ default: m.NewsTickerBarPreview })),
  "form-fill-sequence": () => import("./previews/form-fill-sequence").then((m) => ({ default: m.FormFillSequencePreview })),
  "notification-stack": () => import("./previews/notification-stack").then((m) => ({ default: m.NotificationStackPreview })),
  "tab-switch-panel": () => import("./previews/tab-switch-panel").then((m) => ({ default: m.TabSwitchPanelPreview })),
  "search-results-populate": () => import("./previews/search-results-populate").then((m) => ({ default: m.SearchResultsPopulatePreview })),
  "file-tree-reveal": () => import("./previews/file-tree-reveal").then((m) => ({ default: m.FileTreeRevealPreview })),
  "kanban-move": () => import("./previews/kanban-move").then((m) => ({ default: m.KanbanMovePreview })),
  "commit-graph": () => import("./previews/commit-graph").then((m) => ({ default: m.CommitGraphPreview })),
  "comparison-table": () => import("./previews/comparison-table").then((m) => ({ default: m.ComparisonTablePreview })),
  "pricing-card": () => import("./previews/pricing-card").then((m) => ({ default: m.PricingCardPreview })),
  "faq-accordion": () => import("./previews/faq-accordion").then((m) => ({ default: m.FaqAccordionPreview })),
  "team-grid": () => import("./previews/team-grid").then((m) => ({ default: m.TeamGridPreview })),
  "logo-wall": () => import("./previews/logo-wall").then((m) => ({ default: m.LogoWallPreview })),
  "changelog-entry": () => import("./previews/changelog-entry").then((m) => ({ default: m.ChangelogEntryPreview })),
  "roadmap-lanes": () => import("./previews/roadmap-lanes").then((m) => ({ default: m.RoadmapLanesPreview })),
  "org-chart-build": () => import("./previews/org-chart-build").then((m) => ({ default: m.OrgChartBuildPreview })),
  "quiz-question": () => import("./previews/quiz-question").then((m) => ({ default: m.QuizQuestionPreview })),
  "weather-card": () => import("./previews/weather-card").then((m) => ({ default: m.WeatherCardPreview })),
  "calendar-month-fill": () => import("./previews/calendar-month-fill").then((m) => ({ default: m.CalendarMonthFillPreview })),
  "arrow-annotate": () => import("./previews/arrow-annotate").then((m) => ({ default: m.ArrowAnnotatePreview })),
  "badge-stamp": () => import("./previews/badge-stamp").then((m) => ({ default: m.BadgeStampPreview })),
  "shape-morph": () => import("./previews/shape-morph").then((m) => ({ default: m.ShapeMorphPreview })),
  "blob-morph": () => import("./previews/blob-morph").then((m) => ({ default: m.BlobMorphPreview })),
  "dashed-path-travel": () => import("./previews/dashed-path-travel").then((m) => ({ default: m.DashedPathTravelPreview })),
  "connector-lines": () => import("./previews/connector-lines").then((m) => ({ default: m.ConnectorLinesPreview })),
  "svg-mask-reveal": () => import("./previews/svg-mask-reveal").then((m) => ({ default: m.SvgMaskRevealPreview })),
  "map-heat-overlay": () => import("./previews/map-heat-overlay").then((m) => ({ default: m.MapHeatOverlayPreview })),
  "globe-arc": () => import("./previews/globe-arc").then((m) => ({ default: m.GlobeArcPreview })),
  "multi-device-lineup": () => import("./previews/multi-device-lineup").then((m) => ({ default: m.MultiDeviceLineupPreview })),
  "device-mockup-3d": () => import("./previews/device-mockup-3d").then((m) => ({ default: m.DeviceMockup3DPreview })),
  "dither-field-bg": () => import("./previews/dither-field-bg").then((m) => ({ default: m.DitherFieldBgPreview })),
  "light-tunnel-bg": () => import("./previews/light-tunnel-bg").then((m) => ({ default: m.LightTunnelBgPreview })),
  "text-reveal-shader": () => import("./previews/text-reveal-shader").then((m) => ({ default: m.TextRevealShaderPreview })),
  "warp-bands-bg": () => import("./previews/warp-bands-bg").then((m) => ({ default: m.WarpBandsBgPreview })),
  "grain-gradient-bg": () => import("./previews/grain-gradient-bg").then((m) => ({ default: m.GrainGradientBgPreview })),
  "product-turntable-3d": () => import("./previews/product-turntable-3d").then((m) => ({ default: m.ProductTurntable3dPreview })),
  "text-extrude-3d": () => import("./previews/text-extrude-3d").then((m) => ({ default: m.TextExtrude3dPreview })),
  "card-stack-3d": () => import("./previews/card-stack-3d").then((m) => ({ default: m.CardStack3dPreview })),
  "globe-points-3d": () => import("./previews/globe-points-3d").then((m) => ({ default: m.GlobePoints3dPreview })),
};

/**
 * Tile-only playback window. `infinite-marquee` and `perspective-marquee`
 * declare a 1800-frame (60s) duration in `lib/preview-config.ts` so the doc
 * page shows a full loop before the `Player` restarts it — that number is
 * correct there. A contact-sheet or atlas-grid tile is ~308px: nothing needs
 * a 60-second loop to read as "this scrolls." Cap what the *tile* plays
 * without touching the composition's real duration (`previewMeta` stays the
 * single source everywhere else — the doc page, the still audit, etc.).
 */
const TILE_MAX_DURATION = 180;
const TILE_DURATION_OVERRIDES: Record<string, number> = {
  "infinite-marquee": TILE_MAX_DURATION,
  "perspective-marquee": TILE_MAX_DURATION,
};

export function AtlasMiniPreview({
  slug,
  lane,
  scrubOnHover = false,
  mountOn = "near",
  aspectRatio,
}: AtlasMiniPreviewProps) {
  const loader = PREVIEWS[slug];

  if (!loader) {
    return <DesignedFallback slug={slug} lane={lane} aspectRatio={aspectRatio} />;
  }

  return (
    <LivePreview
      slug={slug}
      loader={loader}
      scrubOnHover={scrubOnHover}
      mountOn={mountOn}
      aspectRatio={aspectRatio}
    />
  );
}

function LivePreview({
  slug,
  loader,
  scrubOnHover,
  mountOn,
  aspectRatio: aspectRatioProp,
}: {
  slug: string;
  loader: PreviewLoader;
  scrubOnHover: boolean;
  mountOn: "near" | "hover";
  aspectRatio?: "16 / 9" | "9 / 16";
}) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height, durationInFrames: fullDuration } = previewMeta(slug);
  const duration = TILE_DURATION_OVERRIDES[slug] ?? fullDuration;
  const aspectRatio =
    aspectRatioProp ?? (height > width ? "9 / 16" : "16 / 9");

  // The Player only exists while the card is near the viewport. It starts
  // false on the server and the first client render, which also keeps
  // browser-only previews (audiogram, waveform, …) out of SSR markup, so
  // hydration has nothing to mismatch against.
  const [near, setNear] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  // Hover-mounted cards show only their poster until pointed at; a card whose
  // poster is missing falls back to mounting when near, so it is never blank.
  const live = near && (mountOn === "near" || posterFailed || hovered);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!live || !player) return;
    player.setVolume(0);
    const id = window.requestAnimationFrame(() => player.play());
    return () => window.cancelAnimationFrame(id);
  }, [live]);

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
    setHovered(false);
    if (!scrubOnHover || !playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
  }, [scrubOnHover]);

  // Still frame shown before the Player mounts and while its chunk loads.
  // alt="" means a missing file renders nothing, and onError drops the element
  // so it is not requested again on remount.
  const poster = posterFailed ? null : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/previews/${slug}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      onError={() => setPosterFailed(true)}
      className="block size-full object-contain"
    />
  );

  return (
    // The stage is decorative: preview text (title cards render <h1>) must not
    // reach the accessibility tree as page headings.
    <div
      ref={containerRef}
      aria-hidden
      data-mini-stage
      className="relative w-full overflow-hidden bg-[var(--bay-stage)]"
      style={{ aspectRatio }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={scrubOnHover ? handleScrub : undefined}
      onMouseLeave={handleLeave}
    >
      {live ? (
        <Player
          ref={playerRef}
          lazyComponent={loader}
          renderLoading={() => poster}
          durationInFrames={duration}
          fps={30}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: "100%", height: "100%", display: "block" }}
          controls={false}
          loop
          autoPlay
          clickToPlay={false}
          initiallyMuted
          showPosterWhenUnplayed={false}
          acknowledgeRemotionLicense
        />
      ) : (
        poster
      )}
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
