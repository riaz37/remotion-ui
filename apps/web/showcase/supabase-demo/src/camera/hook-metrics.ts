import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, spring } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { FPS, HOOK } from "../timeline";
import { PANELS } from "../world/layout";
import { SANS, fontsReady } from "../theme";

/**
 * hook-metrics.ts — the measured geometry of the opening line.
 *
 * The opening camera rides the caret, so it needs to know where the caret is
 * in world units. That is measured from the real font rather than guessed,
 * and only after the font has loaded: `measureText` caches, so a measurement
 * taken against the fallback font would poison every later frame.
 */

export const HOOK_TEXT = {
  fontSize: 92,
  fontWeight: "600",
  letterSpacing: "-0.035em",
  /** World y of the line's vertical centre. */
  centerY: PANELS.hook.y + 318,
  caretGap: 10,
} as const;

export type HookMetrics = {
  /** World x of the line's left edge. */
  left: number;
  /** Width of the line up to the end of word i, including a trailing space for all but the last. */
  ends: number[];
  total: number;
};

const measure = (text: string): number =>
  measureText({
    text,
    fontFamily: SANS,
    fontSize: HOOK_TEXT.fontSize,
    fontWeight: HOOK_TEXT.fontWeight,
    letterSpacing: HOOK_TEXT.letterSpacing,
  }).width;

const compute = (): HookMetrics => {
  const words = HOOK.words;
  const total = measure(words.join(" "));
  const ends = words.map((_, i) => {
    const prefix = words.slice(0, i + 1).join(" ");
    return i < words.length - 1 ? measure(`${prefix} `) : total;
  });
  return { left: PANELS.hook.x + PANELS.hook.w / 2 - total / 2, ends, total };
};

/** How far word `i` has landed, 0..1. Shared by the text and the caret. */
export const wordProgress = (frame: number, i: number): number =>
  spring({
    frame: frame - HOOK.wordFrames[i],
    fps: FPS,
    config: { damping: 200, stiffness: 260 },
    durationInFrames: 8,
  });

/** World x of the caret at `frame`. */
export const hookCaretX = (metrics: HookMetrics, frame: number): number => {
  let x = metrics.left;
  metrics.ends.forEach((end, i) => {
    const start = i === 0 ? 0 : metrics.ends[i - 1];
    x += (end - start) * wordProgress(frame, i);
  });
  return x + HOOK_TEXT.caretGap;
};

export const useHookMetrics = (): HookMetrics | null => {
  const [metrics, setMetrics] = useState<HookMetrics | null>(null);
  const [handle] = useState(() => delayRender("Measuring the opening line"));

  useEffect(() => {
    let cancelled = false;
    fontsReady()
      .then(() => {
        if (!cancelled) {
          setMetrics(compute());
        }
        continueRender(handle);
      })
      .catch((error: unknown) => {
        // Fail loudly: a camera built on fallback metrics frames the wrong words.
        cancelRender(error instanceof Error ? error : new Error("Font loading failed"));
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return metrics;
};
