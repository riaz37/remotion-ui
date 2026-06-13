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
    editablePropNames: ["hookHeadline", "mediaSrc"],
    durationInFrames: 398,
    previewWidth: 1080,
    previewHeight: 1920,
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
