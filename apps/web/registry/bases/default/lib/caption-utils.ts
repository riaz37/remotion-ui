import {
  createTikTokStyleCaptions,
  type Caption,
  type TikTokPage,
} from "@remotion/captions";
import { interpolate } from "remotion";
import { EASING } from "./motion-tokens";

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

/** Absolute composition time for the current sequence frame. */
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

/** Token timing relative to the page sequence start (required inside `<Sequence from={...}>`). */
export function getTokenRelativeFrames(
  token: { fromMs: number; toMs: number },
  page: TikTokPage,
  fps: number,
) {
  const startFrame = Math.round(((token.fromMs - page.startMs) / 1000) * fps);
  const endFrame = Math.round(((token.toMs - page.startMs) / 1000) * fps);
  return { startFrame, endFrame };
}

export function getTokenEmphasis(
  frame: number,
  token: { fromMs: number; toMs: number },
  page: TikTokPage,
  fps: number,
  options?: { enterFrames?: number; exitFrames?: number },
) {
  const enterFrames = options?.enterFrames ?? 6;
  const exitFrames = options?.exitFrames ?? 6;
  const { startFrame, endFrame } = getTokenRelativeFrames(token, page, fps);
  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);
  const active = isTokenActive(token, absoluteTimeMs);

  const enter = interpolate(
    frame,
    [startFrame, startFrame + enterFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  const exit = interpolate(
    frame,
    [endFrame, endFrame + exitFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  return active ? enter : exit;
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
