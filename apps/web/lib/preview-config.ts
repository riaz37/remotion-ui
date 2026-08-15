/**
 * Framing metadata for the docs preview wrappers.
 *
 * Kept free of component imports so build scripts can read it without pulling
 * in React. `atlas-mini-preview.tsx` merges it with the component map, and the
 * still audit renders against the same numbers — otherwise the audit judges a
 * different composition size than the one users actually see.
 */
export type PreviewMeta = {
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
};

/** Composition size the preview wrappers are laid out against. */
export const PREVIEW_DEFAULTS = {
  durationInFrames: 120,
  fps: 30,
  width: 960,
  height: 540,
} as const;

/** Vertical (9:16) previews. */
const VERTICAL = { width: 1080, height: 1920 } as const;

/**
 * Composition previews must run their full length — the scene rebuilds
 * lengthened several of them, and a short window cuts the clip off before its
 * end card, which reads as a broken composition rather than a trimmed preview.
 */
export const PREVIEW_META: Record<string, PreviewMeta> = {
  /* Atoms: enter, hold, then leave inside the window — the exit is part of
   * what the primitive does, so the preview has to be long enough to show it. */
  "fade-in": { durationInFrames: 96 },
  "fade-out": { durationInFrames: 96 },
  "slide-up": { durationInFrames: 96 },
  "slide-left": { durationInFrames: 96 },
  "scale-in": { durationInFrames: 96 },
  "blur-in": { durationInFrames: 96 },
  "spring-in": { durationInFrames: 105 },
  "rotate-in": { durationInFrames: 100 },
  "stagger-children": { durationInFrames: 120 },
  counter: { durationInFrames: 110 },
  typewriter: { durationInFrames: 165 },
  "marker-highlight": { durationInFrames: 110 },
  "progress-bar": { durationInFrames: 110 },
  "audio-pulse": { durationInFrames: 120 },
  "audio-reactive-scale": { durationInFrames: 120 },
  /* The demo transcript runs 5.6s. The window covers it end to end so the
   * 90% sample lands on the last cue rather than on an empty track. */
  "srt-caption-track": { durationInFrames: 170 },
  /* Enter staggers in over frames 8-90, then a staggered exit from 90 — so the
   * 15% / 50% / 90% samples catch arrival, hold and departure. */
  "split-text-chars": { durationInFrames: 120 },
  "audiogram-bars": { durationInFrames: 120 },
  "audiogram-scene": { durationInFrames: 150 },
  "caption-scene": { durationInFrames: 150 },
  "auto-fit-title": { durationInFrames: 130 },
  "b-roll-stack": { durationInFrames: 165 },
  /* Scenes that now take a `holdSeconds` exit. The window is sized so the exit
   * straddles the audit's 90% sample rather than finishing before it — an exit
   * that lands early trades a frozen tail for an empty one, which is worse.
   * window ≈ (holdSeconds + exitFor / 2) * fps / 0.9 */
  "callout-spotlight": { durationInFrames: 120 },
  "caption-bumper": { durationInFrames: 140 },
  "chat-to-preview": { durationInFrames: 190 },
  "end-card": { durationInFrames: 150 },
  "claude-chat": { durationInFrames: 120 },
  "chat-gpt": { durationInFrames: 120 },
  v0: { durationInFrames: 120 },
  "claude-code": { durationInFrames: 120 },
  opencode: { durationInFrames: 120 },
  "creator-reel": { durationInFrames: 390, ...VERTICAL },
  "data-flow-pipes": { durationInFrames: 165 },
  "feature-list": { durationInFrames: 120 },
  "lower-third": { durationInFrames: 150 },
  "media-frame": { durationInFrames: 130 },
  "quote-card": { durationInFrames: 113 },
  "split-screen": { durationInFrames: 165 },
  "stat-card": { durationInFrames: 123 },
  "title-card": { durationInFrames: 140 },
  "media-sequence": { durationInFrames: 210 },
  "zoom-pan-frame": { durationInFrames: 140 },
  "data-story": { durationInFrames: 420 },
  "drag-drop-flow": { durationInFrames: 150 },
  "hero-loop": { durationInFrames: 360 },
  "hero-device-assemble": { durationInFrames: 168 },
  "ecosystem-orbit": { durationInFrames: 180 },
  "bento-pan": { durationInFrames: 180 },
  "browser-flow": { durationInFrames: 168 },
  "ai-generation-canvas": { durationInFrames: 180 },
  "ai-composer-showcase": { durationInFrames: 533 },
  "live-code-split": { durationInFrames: 168 },
  "deploy-reveal": { durationInFrames: 168 },
  "dashboard-populate": { durationInFrames: 168 },
  "pricing-focus": { durationInFrames: 180 },
  "landing-code-showcase": { durationInFrames: 168 },
  "tool-menu-slide": { durationInFrames: 120 },
  "image-expand": { durationInFrames: 120 },
  intro: { durationInFrames: 150 },
  "map-flight": { durationInFrames: 150 },
  "podcast-clip": { durationInFrames: 294, ...VERTICAL },
  showcase: { durationInFrames: 249 },
  "social-clip": { durationInFrames: 216, ...VERTICAL },
  "terminal-simulator": { durationInFrames: 180 },
  "timeline-steps": { durationInFrames: 165 },
  "code-reveal": { durationInFrames: 165 },
  "code-accordion": { durationInFrames: 210 },
  "code-diff-wipe": { durationInFrames: 135 },
  "comment-callout": { durationInFrames: 165 },
  "hook-card": { durationInFrames: 120 },
  "talking-head-layout": { durationInFrames: 195, ...VERTICAL },
  "confetti-burst": { durationInFrames: 72 },
  "device-mockup-zoom": { durationInFrames: 90 },
  "dynamic-grid": { durationInFrames: 90 },
  "mesh-gradient-bg": { durationInFrames: 90 },
  "simulated-cursor": { durationInFrames: 72 },
  "tutorial-clip": { durationInFrames: 248, ...VERTICAL },
  /* Transitions. `transition-previews.tsx` sizes its two scenes from this
   * number and the 18-frame overlap — 69 + 69 - 18 = 120 — so the pair fills
   * the window exactly and the cut lands on the audit's 50% sample. Pinned
   * rather than left to the default because a change to `PREVIEW_DEFAULTS`
   * would silently move every cut off the sample and read as a dead preview. */
  "transition-circle-reveal": { durationInFrames: 120 },
  "transition-card-flip": { durationInFrames: 120 },
  "transition-blinds": { durationInFrames: 120 },
  "transition-whip-pan": { durationInFrames: 120 },
  "transition-morph-shape": { durationInFrames: 120 },
  "transition-liquid-warp": { durationInFrames: 120 },
  "skew-in": { durationInFrames: 120 },
  "scramble-text": { durationInFrames: 120 },
  "text-mask-video": { durationInFrames: 120 },
  "handwriting-text": { durationInFrames: 120 },
  "stroke-to-fill-text": { durationInFrames: 120 },
  "variable-font-morph": { durationInFrames: 120 },
  "liquid-text-morph": { durationInFrames: 120 },
  "wave-text": { durationInFrames: 120 },
  "neon-flicker-text": { durationInFrames: 120 },
  "aurora-bg": { durationInFrames: 120 },
  "particle-field": { durationInFrames: 120 },
  "topographic-lines-bg": { durationInFrames: 120 },
  "caustics-bg": { durationInFrames: 120 },
  "animated-noise-grain": { durationInFrames: 120 },
  "light-rays": { durationInFrames: 120 },
  "parallax-layers": { durationInFrames: 120 },
  "shake-emphasis": { durationInFrames: 120 },
  "glow-pulse": { durationInFrames: 120 },
  "motion-trail": { durationInFrames: 120 },
  "squash-stretch": { durationInFrames: 120 },
  "orbit-motion": { durationInFrames: 120 },
  "depth-of-field-blur": { durationInFrames: 120 },
  "scanline-crt": { durationInFrames: 120 },
  "bar-chart-race": { durationInFrames: 120 },
  "donut-chart": { durationInFrames: 120 },
  "pie-slice-reveal": { durationInFrames: 120 },
  "scatter-plot-pop": { durationInFrames: 120 },
  "bubble-chart-pack": { durationInFrames: 120 },
  "gauge-dial": { durationInFrames: 120 },
  "sparkline-row": { durationInFrames: 120 },
  "heatmap-grid": { durationInFrames: 120 },
  "comparison-bars": { durationInFrames: 120 },
  "funnel-chart": { durationInFrames: 120 },
  "radar-chart": { durationInFrames: 120 },
  "treemap-blocks": { durationInFrames: 120 },
  "waterfall-chart": { durationInFrames: 120 },
  "stacked-area-chart": { durationInFrames: 120 },
  "candlestick-chart": { durationInFrames: 120 },
  "gantt-timeline": { durationInFrames: 120 },
  "word-pop-captions": { durationInFrames: 120 },
  "caption-emoji-beat": { durationInFrames: 120 },
  "speaker-label-captions": { durationInFrames: 120 },
  "transcript-scroll": { durationInFrames: 120 },
  "subtitle-translate": { durationInFrames: 120 },
};

export function previewMeta(slug: string): Required<PreviewMeta> {
  const meta = PREVIEW_META[slug] ?? {};
  return {
    durationInFrames: meta.durationInFrames ?? PREVIEW_DEFAULTS.durationInFrames,
    fps: meta.fps ?? PREVIEW_DEFAULTS.fps,
    width: meta.width ?? PREVIEW_DEFAULTS.width,
    height: meta.height ?? PREVIEW_DEFAULTS.height,
  };
}
