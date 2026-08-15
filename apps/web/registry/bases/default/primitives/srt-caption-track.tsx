import type { Caption, TikTokPage } from "@remotion/captions";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  Sequence,
  useVideoConfig,
} from "remotion";
import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";
import {
  DEFAULT_CAPTION_PAGE_MS,
  getPageSequenceTiming,
  groupCaptionsIntoPages,
  parseSubtitlesToCaptions,
  type WordTiming,
} from "@/remotion/lib/caption-utils";

/**
 * Renders a caption track straight from an SRT or WebVTT file.
 *
 * This is a utility, not a look. Every caption style in the registry takes a
 * `TikTokPage`, which until now had to be hand-authored — so the styles were
 * only ever demoed against four fake words. This turns a real transcript into
 * those pages and sequences them, and `renderPage` swaps in whichever style the
 * caller wants. The default is `caption-highlight`.
 *
 * The one thing to know: **subtitle files carry cue timing, not word timing.**
 * `wordTiming: "distribute"` (the default) spreads each cue's span across its
 * words by length so a word-highlight style has something to highlight. Pass
 * `"cue"` to keep each cue as a single token instead.
 */

export type SrtCaptionTrackProps = {
  /** Raw SRT or WebVTT text. Use this when the transcript is already in hand. */
  source?: string;
  /**
   * URL of a subtitle file, e.g. `staticFile("captions/episode.srt")`.
   * Fetched behind `delayRender()` so the render waits for it.
   */
  src?: string;
  /** Escape hatch: pre-parsed captions, e.g. from Whisper with real word timing. */
  captions?: Caption[];
  wordTiming?: WordTiming;
  /** Tokens closer together than this share a page. */
  combineTokensWithinMilliseconds?: number;
  /** Shift the whole track. Positive delays it. */
  offsetInFrames?: number;
  /** Draws one page. Defaults to `<CaptionHighlight />`. */
  renderPage?: (page: TikTokPage, index: number) => ReactNode;
  /** Passed to the default renderer. Ignored when `renderPage` is given. */
  activeColor?: string;
  inactiveColor?: string;
  fontSize?: number;
  textAlign?: "left" | "center";
  style?: CSSProperties;
  className?: string;
};

export const SrtCaptionTrack: React.FC<SrtCaptionTrackProps> = ({
  source,
  src,
  captions: captionsProp,
  wordTiming = "distribute",
  combineTokensWithinMilliseconds = DEFAULT_CAPTION_PAGE_MS,
  offsetInFrames = 0,
  renderPage,
  activeColor = "#ff6b00",
  inactiveColor = "#ffffff",
  fontSize,
  textAlign = "center",
  style,
  className,
}) => {
  const { fps } = useVideoConfig();
  const [fetched, setFetched] = useState<string | null>(null);
  // The handle is created once, in the initialiser, so a re-render never opens
  // a second one — an unmatched `delayRender()` hangs the render to its timeout
  // rather than failing, which is the hardest version of this bug to diagnose.
  const [handle] = useState(() => (src ? delayRender(`srt-caption-track: ${src}`) : null));

  useEffect(() => {
    if (!src || handle === null) {
      return;
    }
    let cancelled = false;
    fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((text) => {
        if (cancelled) {
          return;
        }
        setFetched(text);
        continueRender(handle);
      })
      .catch((error) => {
        cancelRender(
          new Error(`srt-caption-track could not load ${src}: ${String(error)}`),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [src, handle]);

  const captions = useMemo<Caption[]>(() => {
    if (captionsProp) {
      return captionsProp;
    }
    const text = source ?? fetched;
    if (!text) {
      return [];
    }
    return parseSubtitlesToCaptions(text, wordTiming);
  }, [captionsProp, source, fetched, wordTiming]);

  const pages = useMemo(
    () => groupCaptionsIntoPages(captions, combineTokensWithinMilliseconds),
    [captions, combineTokensWithinMilliseconds],
  );

  return (
    <div className={className} style={style}>
      {pages.map((page, index) => {
        const { startFrame, durationInFrames } = getPageSequenceTiming(
          pages,
          index,
          fps,
          combineTokensWithinMilliseconds,
        );

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={`${page.startMs}-${index}`}
            from={Math.round(startFrame) + Math.round(offsetInFrames)}
            durationInFrames={Math.round(durationInFrames)}
            layout="none"
          >
            {renderPage ? (
              renderPage(page, index)
            ) : (
              <CaptionHighlight
                page={page}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
                fontSize={fontSize}
                textAlign={textAlign}
              />
            )}
          </Sequence>
        );
      })}
    </div>
  );
};
