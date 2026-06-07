import {
  createTikTokStyleCaptions,
  type Caption,
  type TikTokPage,
} from "@remotion/captions";

export const DEFAULT_CAPTION_PAGE_MS = 1200;

export function groupCaptionsIntoPages(
  captions: Caption[],
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
): TikTokPage[] {
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds,
  });
  return pages;
}

export function getAbsoluteTimeMs(page: TikTokPage, frame: number, fps: number) {
  const relativeMs = (frame / fps) * 1000;
  return page.startMs + relativeMs;
}

export function isTokenActive(
  token: { fromMs: number; toMs: number },
  absoluteTimeMs: number,
) {
  return token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
}

export function getPageSequenceTiming(
  pages: TikTokPage[],
  pageIndex: number,
  fps: number,
  maxPageDurationMs = DEFAULT_CAPTION_PAGE_MS,
) {
  const page = pages[pageIndex];
  const nextPage = pages[pageIndex + 1] ?? null;
  const startFrame = (page.startMs / 1000) * fps;
  const switchEndFrame = startFrame + (maxPageDurationMs / 1000) * fps;
  const contentEndFrame = startFrame + (page.durationMs / 1000) * fps;
  const nextPageStartFrame = nextPage
    ? (nextPage.startMs / 1000) * fps
    : Infinity;

  const endFrame = nextPage
    ? Math.min(nextPageStartFrame, switchEndFrame)
    : Math.min(contentEndFrame, nextPageStartFrame);

  const durationInFrames = endFrame - startFrame;

  return { startFrame, durationInFrames };
}
