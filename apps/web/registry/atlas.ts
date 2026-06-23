export const ATLAS_LANES = {
  atoms: {
    label: "Primitives",
    description: "Motion, text effects, and backgrounds",
  },
  signals: {
    label: "Data & media",
    description: "Captions, audio, charts, and live metrics",
  },
  vectors: {
    label: "Paths & shapes",
    description: "SVG draw-on, logos, and cursors",
  },
  spatial: {
    label: "Maps & device",
    description: "Map scenes and device mockups",
  },
  blocks: {
    label: "Scenes",
    description: "Composed layouts, cards, and UI blocks",
  },
  cuts: {
    label: "Transitions",
    description: "TransitionSeries scene cuts",
  },
  reels: {
    label: "Compositions",
    description: "Full video templates",
  },
} as const;

export type AtlasLane = keyof typeof ATLAS_LANES;
export type AtlasDrive = "time" | "data" | "media" | "spatial";
export type AtlasTier = "core" | "advanced";

export type AtlasTagGroup = {
  tag: string;
  label: string;
  minItems?: number;
};

/** Tag sub-sections within a lane for docs sidebar and browse filters. */
export const TAG_GROUPS: Record<AtlasLane, AtlasTagGroup[]> = {
  atoms: [
    { tag: "text", label: "Text effects", minItems: 3 },
    { tag: "background", label: "Backgrounds", minItems: 2 },
  ],
  signals: [
    { tag: "captions", label: "Captions", minItems: 3 },
    { tag: "audio", label: "Audio", minItems: 3 },
    { tag: "charts", label: "Charts & metrics", minItems: 2 },
  ],
  vectors: [],
  spatial: [],
  blocks: [
    { tag: "ai", label: "AI composers", minItems: 3 },
    { tag: "code", label: "Code & terminal", minItems: 3 },
    { tag: "creator", label: "Creator", minItems: 3 },
    { tag: "ui", label: "UI flows", minItems: 2 },
  ],
  cuts: [],
  reels: [],
};

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
  "marker-highlight": {
    lane: "atoms",
    drive: "time",
    tier: "core",
    tags: ["text"],
  },
  "progress-bar": { lane: "atoms", drive: "time", tier: "core" },
  "blur-focus-in": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "staggered-fade-up": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "masked-slide-reveal": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "tracking-in": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "light-sweep-text": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "slot-roll": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "matrix-decode": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "rgb-glitch-text": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "infinite-marquee": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "perspective-marquee": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  "strikethrough-replace": { lane: "atoms", drive: "time", tier: "advanced", tags: ["text"] },
  // Cuts
  "transition-fade": { lane: "cuts", drive: "time", tier: "core" },
  "transition-slide": { lane: "cuts", drive: "time", tier: "core" },
  "transition-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "transition-clock-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "transition-light-leak": { lane: "cuts", drive: "time", tier: "advanced" },
  "blur-reveal": { lane: "cuts", drive: "time", tier: "advanced" },
  "grid-pixelate-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "frosted-glass-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
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
    tags: ["charts", "metrics"],
  },
  "timeline-steps": { lane: "blocks", drive: "time", tier: "core" },
  "callout-spotlight": { lane: "blocks", drive: "time", tier: "core" },
  "zoom-pan-frame": { lane: "blocks", drive: "media", tier: "core" },
  "code-reveal": { lane: "blocks", drive: "time", tier: "core", tags: ["code"] },
  "terminal-simulator": { lane: "blocks", drive: "time", tier: "core", tags: ["code"] },
  "code-accordion": { lane: "blocks", drive: "time", tier: "core", tags: ["code"] },
  "code-diff-wipe": { lane: "blocks", drive: "time", tier: "core", tags: ["code"] },
  "data-flow-pipes": { lane: "blocks", drive: "data", tier: "advanced", tags: ["data"] },
  "drag-drop-flow": { lane: "blocks", drive: "time", tier: "core", tags: ["ui"] },
  "chat-to-preview": { lane: "blocks", drive: "time", tier: "advanced", tags: ["ui"] },
  "claude-chat": { lane: "blocks", drive: "time", tier: "core", tags: ["ai"] },
  "chat-gpt": { lane: "blocks", drive: "time", tier: "core", tags: ["ai"] },
  v0: { lane: "blocks", drive: "time", tier: "core", tags: ["ai"] },
  "claude-code": { lane: "blocks", drive: "time", tier: "core", tags: ["ai"] },
  opencode: { lane: "blocks", drive: "time", tier: "core", tags: ["ai"] },
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
  "line-chart-draw": {
    lane: "signals",
    drive: "data",
    tier: "advanced",
    tags: ["charts"],
  },
  "cursor-path": { lane: "vectors", drive: "time", tier: "core" },
  // Spatial
  "map-canvas": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-route": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-markers": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "map-flight": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "mesh-gradient-bg": { lane: "atoms", drive: "time", tier: "advanced", tags: ["background"] },
  "dynamic-grid": { lane: "atoms", drive: "time", tier: "advanced", tags: ["background"] },
  "directional-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "spatial-push": { lane: "cuts", drive: "time", tier: "advanced" },
  "chromatic-aberration-wipe": { lane: "cuts", drive: "time", tier: "advanced" },
  "zoom-through": { lane: "cuts", drive: "time", tier: "advanced" },
  "confetti-burst": { lane: "atoms", drive: "time", tier: "advanced" },
  "simulated-cursor": { lane: "vectors", drive: "time", tier: "core" },
  "device-mockup-zoom": { lane: "spatial", drive: "spatial", tier: "advanced" },
  "hero-device-assemble": {lane:"reels",drive:"time",tier:"advanced"},
  "ecosystem-orbit": {lane:"reels",drive:"time",tier:"advanced"},
  "bento-pan": {lane:"reels",drive:"time",tier:"advanced"},
  "browser-flow": {lane:"reels",drive:"time",tier:"advanced"},
  "ai-generation-canvas": {lane:"reels",drive:"time",tier:"advanced"},
  "live-code-split": {lane:"reels",drive:"time",tier:"advanced"},
  "deploy-reveal": {lane:"reels",drive:"time",tier:"advanced"},
  "dashboard-populate": {lane:"reels",drive:"data",tier:"advanced"},
  "pricing-focus": {lane:"reels",drive:"time",tier:"advanced"},
  "landing-code-showcase": {lane:"reels",drive:"time",tier:"advanced"},
  "tool-menu-slide": {lane:"reels",drive:"time",tier:"advanced"},
  "image-expand": {lane:"reels",drive:"media",tier:"advanced"},
};

export function getAtlasMeta(name: string): AtlasMeta | undefined {
  return REGISTRY_ATLAS[name];
}

export function getItemsByLane(lane: AtlasLane): string[] {
  return Object.entries(REGISTRY_ATLAS)
    .filter(([, meta]) => meta.lane === lane)
    .map(([name]) => name);
}
