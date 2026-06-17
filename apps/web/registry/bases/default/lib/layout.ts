/** Video-layout safe area — 80px sides / 100px vertical at 1080p reference */
const REFERENCE_WIDTH = 1080;
const REFERENCE_HEIGHT = 1080;
const HORIZONTAL_SAFE = 80;
const VERTICAL_SAFE = 100;

export type SafePaddingOptions = {
  width: number;
  height: number;
  ratio?: number;
};

export type SafeAreaPadding = {
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
};

/** Per-edge safe area from video-layout guidance */
export function getSafeAreaPadding({
  width,
  height,
}: {
  width: number;
  height: number;
}): SafeAreaPadding {
  const horizontal = Math.round((HORIZONTAL_SAFE / REFERENCE_WIDTH) * width);
  const vertical = Math.round((VERTICAL_SAFE / REFERENCE_HEIGHT) * height);

  return {
    paddingLeft: horizontal,
    paddingRight: horizontal,
    paddingTop: vertical,
    paddingBottom: vertical,
  };
}

/** Uniform padding — max of horizontal/vertical safe insets */
export function getSafePadding({
  width,
  height,
  ratio,
}: SafePaddingOptions): number {
  if (ratio !== undefined) {
    return Math.round(Math.min(width, height) * ratio);
  }

  const { paddingLeft, paddingTop } = getSafeAreaPadding({ width, height });
  return Math.max(paddingLeft, paddingTop);
}

/**
 * Scale a font size defined at 1080p width to any composition width.
 * Skill minimums at 1080: headline 84, supporting 44, label 32.
 */
export function scaleFont(
  sizeAt1080: number,
  width: number,
  referenceWidth = REFERENCE_WIDTH,
): number {
  return Math.round(sizeAt1080 * (width / referenceWidth));
}

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Clamp a rect inside the video safe area (for spotlight targets, overlays). */
export function clampRectToSafeArea(
  rect: Rect,
  frameWidth: number,
  frameHeight: number,
): Rect {
  const safe = getSafeAreaPadding({ width: frameWidth, height: frameHeight });
  const minX = safe.paddingLeft;
  const minY = safe.paddingTop;
  const maxX = frameWidth - safe.paddingRight;
  const maxY = frameHeight - safe.paddingBottom;

  const width = Math.min(rect.width, maxX - minX);
  const height = Math.min(rect.height, maxY - minY);
  const x = Math.min(Math.max(rect.x, minX), maxX - width);
  const y = Math.min(Math.max(rect.y, minY), maxY - height);

  return { x, y, width, height };
}

/** Preview aspect presets for docs QA */
export const PREVIEW_LANDSCAPE = { width: 960, height: 540 } as const;
export const PREVIEW_PORTRAIT = { width: 1080, height: 1920 } as const;
export const PREVIEW_HD = { width: 1920, height: 1080 } as const;
