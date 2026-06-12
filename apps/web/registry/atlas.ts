export const ATLAS_LANES = {
  atoms: {
    label: "Atoms",
    description: "Frame-level enter/exit motion",
  },
  signals: {
    label: "Signals",
    description: "Data- and media-driven motion",
  },
  vectors: {
    label: "Vectors",
    description: "SVG paths, shapes, draw-on",
  },
  spatial: {
    label: "Spatial",
    description: "Maps, camera, depth",
  },
  blocks: {
    label: "Blocks",
    description: "Composed scene layouts",
  },
  cuts: {
    label: "Cuts",
    description: "TransitionSeries presets",
  },
  reels: {
    label: "Reels",
    description: "Full composition templates",
  },
} as const;

export type AtlasLane = keyof typeof ATLAS_LANES;
export type AtlasDrive = "time" | "data" | "media" | "spatial";
export type AtlasTier = "core" | "advanced";

export type AtlasMeta = {
  lane: AtlasLane;
  drive: AtlasDrive;
  tier: AtlasTier;
  tags?: string[];
};

export const REGISTRY_ATLAS: Record<string, AtlasMeta> = {
  // Atoms
  "fade-in": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "fade-out": { lane: "atoms", drive: "time", tier: "core", tags: ["exit"] },
  "slide-up": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "slide-left": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "scale-in": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "blur-in": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "spring-in": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "rotate-in": { lane: "atoms", drive: "time", tier: "core", tags: ["enter"] },
  "stagger-children": {
    lane: "atoms",
    drive: "time",
    tier: "core",
    tags: ["sequence"],
  },
  typewriter: { lane: "atoms", drive: "time", tier: "core", tags: ["text"] },
  counter: { lane: "atoms", drive: "time", tier: "core", tags: ["text"] },
  "word-highlight": {
    lane: "atoms",
    drive: "time",
    tier: "core",
    tags: ["text"],
  },
  "progress-bar": { lane: "atoms", drive: "time", tier: "core" },
  // Cuts
  "transition-fade": { lane: "cuts", drive: "time", tier: "core" },
  "transition-slide": { lane: "cuts", drive: "time", tier: "core" },
  "transition-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "transition-clock-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "transition-light-leak": { lane: "cuts", drive: "time", tier: "advanced" },
  // Blocks
  "lower-third": { lane: "blocks", drive: "time", tier: "core" },
  "title-card": { lane: "blocks", drive: "time", tier: "core" },
  "feature-list": { lane: "blocks", drive: "time", tier: "core" },
  "stat-card": { lane: "blocks", drive: "time", tier: "core" },
  "quote-card": { lane: "blocks", drive: "time", tier: "core" },
  "end-card": { lane: "blocks", drive: "time", tier: "core" },
  "auto-fit-title": { lane: "blocks", drive: "data", tier: "advanced" },
  "media-frame": { lane: "blocks", drive: "media", tier: "advanced" },
  "media-sequence": { lane: "blocks", drive: "media", tier: "advanced" },
  "split-screen": { lane: "blocks", drive: "media", tier: "advanced" },
  "b-roll-stack": { lane: "blocks", drive: "media", tier: "core" },
  "caption-bumper": { lane: "blocks", drive: "data", tier: "advanced" },
  "animated-bar-chart": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["charts"],
  },
  "metric-ticker": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["metrics"],
  },
  "timeline-steps": { lane: "blocks", drive: "time", tier: "core" },
  "callout-spotlight": { lane: "blocks", drive: "time", tier: "core" },
  "zoom-pan-frame": { lane: "blocks", drive: "media", tier: "core" },
  "code-reveal": { lane: "blocks", drive: "time", tier: "core" },
  "hook-card": {
    lane: "blocks",
    drive: "time",
    tier: "advanced",
    tags: ["creator"],
  },
  "talking-head-layout": {
    lane: "blocks",
    drive: "media",
    tier: "advanced",
    tags: ["creator", "captions"],
  },
  "comment-callout": {
    lane: "blocks",
    drive: "time",
    tier: "advanced",
    tags: ["creator", "social"],
  },
  // Reels
  intro: { lane: "reels", drive: "time", tier: "core" },
  showcase: { lane: "reels", drive: "time", tier: "core" },
  "hero-loop": {
    lane: "reels",
    drive: "time",
    tier: "core",
    tags: ["hero", "website"],
  },
  "social-clip": { lane: "reels", drive: "media", tier: "advanced" },
  "tutorial-clip": { lane: "reels", drive: "media", tier: "advanced" },
  "data-story": { lane: "reels", drive: "data", tier: "advanced" },
  "podcast-clip": { lane: "reels", drive: "media", tier: "advanced" },
  "creator-reel": {
    lane: "reels",
    drive: "media",
    tier: "advanced",
    tags: ["creator", "social"],
  },
  // Signals
  "caption-highlight": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["captions"],
  },
  "caption-scene": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["captions"],
  },
  "audiogram-bars": {
    lane: "signals",
    drive: "media",
    tier: "advanced",
    tags: ["audio"],
  },
  "audiogram-scene": {
    lane: "signals",
    drive: "media",
    tier: "advanced",
    tags: ["audio"],
  },
  "karaoke-captions": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["captions"],
  },
  "waveform-line": {
    lane: "signals",
    drive: "media",
    tier: "advanced",
    tags: ["audio"],
  },
  "audio-pulse": {
    lane: "signals",
    drive: "media",
    tier: "advanced",
    tags: ["audio"],
  },
  // Vectors
  "path-draw": { lane: "vectors", drive: "time", tier: "advanced" },
  "logo-reveal": { lane: "vectors", drive: "time", tier: "advanced" },
  "line-chart-draw": { lane: "vectors", drive: "data", tier: "advanced" },
  "cursor-path": { lane: "vectors", drive: "time", tier: "core" },
  // Spatial
  "map-canvas": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-route": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-markers": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-flight": { lane: "spatial", drive: "spatial", tier: "advanced" },
};

export function getAtlasMeta(name: string): AtlasMeta | undefined {
  return REGISTRY_ATLAS[name];
}

export function getItemsByLane(lane: AtlasLane): string[] {
  return Object.entries(REGISTRY_ATLAS)
    .filter(([, meta]) => meta.lane === lane)
    .map(([name]) => name);
}
