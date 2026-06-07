import type { CSSProperties } from "react";

export type MediaFit = "cover" | "contain";

export type MediaItem = {
  src: string;
  title?: string;
  caption?: string;
  durationInFrames?: number;
  fit?: MediaFit;
  backgroundColor?: string;
};

export type MediaWindow = MediaItem & {
  from: number;
  durationInFrames: number;
  index: number;
};

export function getMediaObjectFitStyle(
  fit: MediaFit = "cover",
): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
  };
}

export function resolveMediaWindows(
  items: MediaItem[],
  defaultDurationInFrames = 90,
): MediaWindow[] {
  let cursor = 0;

  return items.map((item, index) => {
    const durationInFrames =
      item.durationInFrames ?? defaultDurationInFrames;
    const window = {
      ...item,
      from: cursor,
      durationInFrames,
      index,
    };
    cursor += durationInFrames;
    return window;
  });
}

export function getTotalMediaDuration(
  items: MediaItem[],
  defaultDurationInFrames = 90,
): number {
  return resolveMediaWindows(items, defaultDurationInFrames).reduce(
    (total, item) => total + item.durationInFrames,
    0,
  );
}

export function isVideoSource(src: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src);
}
