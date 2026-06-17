export type CompositionPlaygroundMeta = {
  editablePropNames: string[];
  durationInFrames: number;
  previewWidth: number;
  previewHeight: number;
};

const PLAYGROUND_META: Record<string, CompositionPlaygroundMeta> = {
  "social-clip": {
    editablePropNames: ["hookTitle", "hookSubtitle", "ctaLabel", "logoSrc"],
    durationInFrames: 228,
    previewWidth: 1080,
    previewHeight: 1920,
  },
  "creator-reel": {
    editablePropNames: [
      "hookHeadline",
      "hookSubtitle",
      "mediaSrc",
      "ctaLabel",
      "comment",
    ],
    durationInFrames: 390,
    previewWidth: 1080,
    previewHeight: 1920,
  },
  "podcast-clip": {
    editablePropNames: ["title", "subtitle", "ctaLabel"],
    durationInFrames: 366,
    previewWidth: 1080,
    previewHeight: 1920,
  },
  "data-story": {
    editablePropNames: ["title", "insight", "ctaLabel"],
    durationInFrames: 420,
    previewWidth: 1920,
    previewHeight: 1080,
  },
  intro: {
    editablePropNames: ["title", "subtitle"],
    durationInFrames: 150,
    previewWidth: 960,
    previewHeight: 540,
  },
};

export function getCompositionPlaygroundMeta(
  name: string,
): CompositionPlaygroundMeta | undefined {
  return PLAYGROUND_META[name];
}

export function hasCompositionPlayground(name: string): boolean {
  return name in PLAYGROUND_META;
}
