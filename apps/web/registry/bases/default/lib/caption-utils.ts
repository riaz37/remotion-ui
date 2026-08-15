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
  // A word holds for 200-800ms, so emphasis has to arrive fast and release
  // slower — a symmetric ramp reads as a flicker on short tokens.
  const enterFrames = options?.enterFrames ?? 4;
  const exitFrames = options?.exitFrames ?? 9;
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

  // Releasing emphasis is a settle, not an exit — accelerating away would snap
  // the word back to its resting size.
  const exit = interpolate(
    frame,
    [endFrame, endFrame + exitFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );

  if (active) {
    return enter;
  }

  // Tokens that have not been spoken yet sit at rest — the exit ramp clamps to
  // 1 before its own end frame, so it must not be read for future words.
  return frame < startFrame ? 0 : exit;
}

/** One subtitle cue: a block of text with a start and an end, no word timing. */
export type SubtitleCue = {
  text: string;
  startMs: number;
  endMs: number;
  /** WebVTT `<v Name>` voice tag, when present. */
  speaker?: string;
};

/** `00:01:02,500`, `00:01:02.500` and the VTT short form `01:02.500`. */
const TIMESTAMP = /(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})/;
const CUE_LINE = new RegExp(
  `${TIMESTAMP.source}\\s*-->\\s*${TIMESTAMP.source}`,
);

function timestampToMs(match: RegExpMatchArray, offset: number): number {
  const hours = Number(match[offset] ?? 0) || 0;
  const minutes = Number(match[offset + 1]) || 0;
  const seconds = Number(match[offset + 2]) || 0;
  // A two-digit fraction is centiseconds, not milliseconds.
  const fraction = match[offset + 3] ?? "0";
  const millis = Number(fraction.padEnd(3, "0").slice(0, 3)) || 0;
  return hours * 3_600_000 + minutes * 60_000 + seconds * 1000 + millis;
}

/**
 * Strips the markup a cue body may carry.
 *
 * WebVTT karaoke files inline per-word timestamps as `<00:00:01.200>`. They are
 * removed rather than used: they are optional, frequently wrong, and mixing a
 * file that has them with one that does not would make the same component time
 * two transcripts differently.
 */
function cleanCueText(text: string): { text: string; speaker?: string } {
  const voice = /<v(?:\.[^\s>]+)*\s+([^>]+)>/.exec(text);
  return {
    speaker: voice?.[1]?.trim(),
    text: text
      .replace(/<[^>]*>/g, "")
      .replace(/\{\\an?\d\}/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

/**
 * Parses SRT or WebVTT into cues.
 *
 * One parser covers both: the only structural differences are the `WEBVTT`
 * header, the metadata blocks, and `.` instead of `,` before the milliseconds.
 * Cue settings after the timestamps (`align:start position:10%`) are ignored.
 */
export function parseSubtitles(source: string): SubtitleCue[] {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const cues: SubtitleCue[] = [];

  for (const block of normalized.split(/\n{2,}/)) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      continue;
    }

    const header = lines[0].trim();
    // WEBVTT / NOTE / STYLE / REGION blocks carry no timing.
    if (/^(WEBVTT|NOTE|STYLE|REGION)\b/.test(header) && !CUE_LINE.test(block)) {
      continue;
    }

    const timingIndex = lines.findIndex((line) => CUE_LINE.test(line));
    if (timingIndex === -1) {
      continue;
    }

    const match = CUE_LINE.exec(lines[timingIndex]);
    if (!match) {
      continue;
    }

    const startMs = timestampToMs(match, 1);
    const endMs = timestampToMs(match, 5);
    const body = lines.slice(timingIndex + 1).join(" ");
    const { text, speaker } = cleanCueText(body);

    if (text.length === 0 || endMs <= startMs) {
      continue;
    }

    cues.push({ text, startMs, endMs, speaker });
  }

  return cues.sort((a, b) => a.startMs - b.startMs);
}

export type WordTiming = "distribute" | "cue";

/**
 * Turns cues into `Caption` tokens.
 *
 * **Subtitle files have no word timestamps.** A cue says "these nine words
 * happen between 4.2s and 6.8s" and nothing more, so a word-highlight style fed
 * raw cues has nothing to highlight. `distribute` splits the cue's span across
 * its words weighted by length — a nine-letter word holds roughly three times
 * as long as a three-letter one, which is close enough to speech that a
 * highlight tracks the read. `cue` keeps the whole cue as one token, which is
 * honest but only useful for styles that show a whole line at once.
 */
export function cuesToCaptions(
  cues: SubtitleCue[],
  wordTiming: WordTiming = "distribute",
): Caption[] {
  const captions: Caption[] = [];

  for (const cue of cues) {
    if (wordTiming === "cue") {
      captions.push({
        text: ` ${cue.text}`,
        startMs: cue.startMs,
        endMs: cue.endMs,
        timestampMs: cue.startMs,
        confidence: 1,
      });
      continue;
    }

    const words = cue.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      continue;
    }

    // +1 per word so single-character words still get a readable slice.
    const weights = words.map((word) => word.length + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const span = cue.endMs - cue.startMs;

    let elapsed = 0;
    words.forEach((word, index) => {
      const startMs = cue.startMs + (elapsed / totalWeight) * span;
      elapsed += weights[index];
      const endMs = cue.startMs + (elapsed / totalWeight) * span;

      captions.push({
        // Tokens carry their own leading space: the caption renderers place the
        // gap outside the emphasised box so a growing word does not close it.
        text: ` ${word}`,
        startMs: Math.round(startMs),
        endMs: Math.round(endMs),
        timestampMs: Math.round(startMs),
        confidence: 1,
      });
    });
  }

  return captions;
}

/** Convenience: raw subtitle text straight to `Caption[]`. */
export function parseSubtitlesToCaptions(
  source: string,
  wordTiming: WordTiming = "distribute",
): Caption[] {
  return cuesToCaptions(parseSubtitles(source), wordTiming);
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
