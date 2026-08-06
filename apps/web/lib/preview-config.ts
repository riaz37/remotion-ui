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
  "audiogram-bars": { durationInFrames: 120 },
  "audiogram-scene": { durationInFrames: 150 },
  "caption-scene": { durationInFrames: 150 },
  "auto-fit-title": { durationInFrames: 130 },
  "b-roll-stack": { durationInFrames: 165 },
  "callout-spotlight": { durationInFrames: 165 },
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
  "feature-list": { durationInFrames: 190 },
  "lower-third": { durationInFrames: 150 },
  "media-frame": { durationInFrames: 130 },
  "quote-card": { durationInFrames: 140 },
  "split-screen": { durationInFrames: 165 },
  "stat-card": { durationInFrames: 150 },
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
