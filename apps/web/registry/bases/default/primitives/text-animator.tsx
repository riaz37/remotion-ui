import { measureText } from "@remotion/layout-utils";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";
import { layoutGlyphs, plainRuns, type GlyphBox, type GlyphLayout } from "@/remotion/lib/glyph-layout";
import {
  computeGlyphStates,
  type GlyphState,
  type TextAnimatorLayer,
} from "@/remotion/lib/text-selectors";

export type {
  AnimatorProperties,
  RangeSelector,
  SelectorShape,
  TextAnimatorLayer,
  TextSelector,
  WigglySelector,
} from "@/remotion/lib/text-selectors";

export type TextAnimatorProps = {
  text: string;
  /** Applied in order; positions and rotations add, scales and opacities multiply. */
  animators?: TextAnimatorLayer[];
  /** Defaults to 84px at 1080 wide, scaled to the composition. */
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  /** Multiple of the font size. */
  lineHeight?: number;
  /** Base tracking in em. */
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  /** Wrap width. Defaults to 84% of the composition width. */
  maxWidth?: number;
  /** Pivot for scale and rotation: each glyph, its word, its line, or the block. */
  anchorGrouping?: "character" | "word" | "line" | "all";
  /**
   * Resolves when the face is ready — pass `waitUntilDone` from
   * `@remotion/google-fonts` / `@remotion/fonts`. Without it the component
   * waits for a loaded face of the primary family to appear (up to 1.5s,
   * after which it assumes a system font).
   */
  waitForFont?: () => Promise<unknown>;
  /** Render a specific frame instead of the current one. */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};


const DEFAULT_FAMILY = "Inter, system-ui, sans-serif";

/** How long to wait for a web font face to be registered before assuming a system font. */
const FACE_WAIT_MS = 1500;
const FACE_POLL_MS = 40;

/** The first family in a CSS font-family list, unquoted. */
function primaryFamily(stack: string): string {
  return stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
}

function hasLoadedFace(family: string): boolean {
  let found = false;
  document.fonts.forEach((face) => {
    if (face.family.replace(/^["']|["']$/g, "") === family && face.status === "loaded") found = true;
  });
  return found;
}

/**
 * Holds the render until the text can be measured in the face it will be
 * drawn in, and not a moment before.
 *
 * `document.fonts.load()` is not enough on its own: `@remotion/google-fonts`
 * fetches and loads a face *outside* the font set and only then adds it, so
 * until that moment `load()` resolves at once and measurement falls back to
 * system-ui — which `measureText` then caches. In a headless render that
 * made every word ~9% narrower than the glyphs drawn over it and swallowed
 * the word gaps. So nothing is measured until a loaded face for the primary
 * family is actually in the set, or `waitForFont` (e.g. `waitUntilDone` from
 * `loadFont`) resolves. With neither, after FACE_WAIT_MS it is taken to be a
 * system font, which measures correctly as it is.
 */
function useFontReady(
  fontFamily: string,
  fontWeight: number,
  waitForFont: (() => Promise<unknown>) | undefined,
): boolean {
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const pending = useRef<number | null>(null);

  const release = useCallback(() => {
    const handle = pending.current;
    if (handle === null) return;
    pending.current = null;
    continueRender(handle);
  }, [continueRender]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      setReady(true);
      return undefined;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    pending.current = delayRender(`text-animator: waiting for ${fontWeight} ${fontFamily}`);
    const family = primaryFamily(fontFamily);

    const settle = () => {
      if (!active) return;
      setReady(true);
      release();
    };
    const waitForFace = (startedAt: number) => {
      if (!active) return;
      if (hasLoadedFace(family) || Date.now() - startedAt >= FACE_WAIT_MS) {
        document.fonts.load(`${fontWeight} 100px ${fontFamily}`).then(settle, settle);
        return;
      }
      timer = setTimeout(() => waitForFace(startedAt), FACE_POLL_MS);
    };

    const explicit = waitForFont ? waitForFont() : Promise.resolve();
    explicit
      .then(() => Promise.all([document.fonts.load(`${fontWeight} 100px ${fontFamily}`), document.fonts.ready]))
      .then(() => (waitForFont ? settle() : waitForFace(Date.now())))
      .catch((error: unknown) => {
        release();
        cancelRender(error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      release();
    };
  }, [fontFamily, fontWeight, waitForFont, delayRender, cancelRender, release]);

  return ready;
}

const RANGES: Array<[number, number]> = [
  [65, 90],
  [97, 122],
  [48, 57],
];

function shiftCharacter(char: string, shift: number): string {
  if (shift === 0) return char;
  const code = char.codePointAt(0) ?? 0;
  const range = RANGES.find(([lo, hi]) => code >= lo && code <= hi);
  if (!range) return char;
  const span = range[1] - range[0] + 1;
  const next = (((code - range[0] + shift) % span) + span) % span;
  return String.fromCodePoint(range[0] + next);
}

/**
 * After Effects' Text Animator. Declare what selected glyphs should become —
 * lower, blurred, rotated, recoloured — and animate the selector that decides
 * which glyphs are selected. The layout underneath is measured, so tracking
 * pushes real neighbours and wrapped lines never collide.
 */
export const TextAnimator: React.FC<TextAnimatorProps> = ({
  text,
  animators = [],
  fontSize: fontSizeProp,
  fontFamily = DEFAULT_FAMILY,
  fontWeight = 700,
  color = "#f4f4f5",
  lineHeight = 1.12,
  letterSpacing = -0.02,
  align = "center",
  maxWidth: maxWidthProp,
  anchorGrouping = "character",
  waitForFont,
  frame: frameOverride,
  style,
  className,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const frame = frameOverride ?? currentFrame;
  const fontSize = fontSizeProp ?? Math.round((84 * width) / 1080);
  const maxWidth = maxWidthProp ?? width * 0.84;
  const ready = useFontReady(fontFamily, fontWeight, waitForFont);

  const layout = useMemo<GlyphLayout | null>(() => {
    if (!ready) return null;
    // Measured at the size actually drawn. Scaling a reference measurement
    // drifts from the browser's own advances by a fraction of a pixel per
    // glyph, which would show as a jump whenever a glyph moves between a plain
    // run (laid out by the browser) and its own positioned span.
    const measure = (value: string, size: number) =>
      measureText({ text: value, fontFamily, fontSize: size, fontWeight: String(fontWeight) }).width;
    return layoutGlyphs({ text, fontSize, maxWidth, letterSpacing, lineHeight, measure });
  }, [ready, text, fontFamily, fontWeight, fontSize, maxWidth, letterSpacing, lineHeight]);

  const states = useMemo<GlyphState[]>(
    () => (layout ? computeGlyphStates(layout, animators, color, { frame, fps }) : []),
    [layout, animators, frame, fps, color],
  );

  if (!layout) {
    return <div aria-label={text} className={className} style={style} />;
  }

  // One pass per line: each glyph's accumulated tracking push, and the line's
  // alignment offset. Animated tracking changes a line's width every frame;
  // alignment follows it, exactly as AE re-centres a line whose tracking moves.
  const push = new Float64Array(layout.glyphs.length);
  const lineOffsets = layout.lines.map((line) => {
    let sum = 0;
    line.glyphs.forEach((g, i) => {
      push[g.index] = sum;
      if (i < line.glyphs.length - 1) sum += states[g.index]?.tracking ?? 0;
    });
    const lineWidth = line.width + sum;
    if (align === "left") return 0;
    if (align === "right") return layout.width - lineWidth;
    return (layout.width - lineWidth) / 2;
  });

  const trackedX = (glyph: GlyphBox) => lineOffsets[glyph.lineIndex] + glyph.x + push[glyph.index];

  // A glyph no animator is touching this frame costs what plain text costs:
  // consecutive ones on a line share a single span, no transform, no filter.
  const isPlain = (index: number) => {
    const s = states[index];
    return (
      !!s &&
      Math.abs(s.dx) < 0.01 &&
      Math.abs(s.dy) < 0.01 &&
      Math.abs(s.scale - 1) < 1e-4 &&
      Math.abs(s.rotation) < 0.01 &&
      Math.abs(s.skew) < 0.01 &&
      s.opacity > 0.999 &&
      s.blur <= 0.05 &&
      Math.abs(s.tracking) < 0.01 &&
      s.charShift === 0 &&
      s.color === color
    );
  };
  const runs = plainRuns(layout, isPlain);

  const pivot = (glyph: GlyphBox, x: number): [number, number] => {
    const half = layout.lineHeightPx / 2;
    const line = layout.lines[glyph.lineIndex];
    if (anchorGrouping === "word") {
      const word = line.words.find((w) => w.index === glyph.wordIndex);
      const first = word ? trackedX(word.glyphs[0]) : x;
      const last = word ? word.glyphs[word.glyphs.length - 1] : glyph;
      const right = trackedX(last) + last.width;
      return [(first + right) / 2 - x, half];
    }
    if (anchorGrouping === "line") {
      return [lineOffsets[glyph.lineIndex] + line.width / 2 - x, half];
    }
    if (anchorGrouping === "all") {
      return [layout.width / 2 - x, layout.height / 2 - line.y];
    }
    return [glyph.width / 2, half];
  };

  return (
    <div
      aria-label={text}
      role="img"
      className={className}
      style={{
        position: "relative",
        width: layout.width,
        height: layout.height,
        fontFamily,
        fontWeight,
        fontSize: layout.fontSize,
        lineHeight: `${layout.lineHeightPx}px`,
        ...style,
      }}
    >
      {runs.map((run) => (
        <span
          key={`run-${run.start}`}
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: layout.lineHeightPx,
            whiteSpace: "pre",
            letterSpacing: `${letterSpacing}em`,
            color,
            transform: `translate(${trackedX(layout.glyphs[run.start])}px, ${layout.lines[run.lineIndex].y}px)`,
          }}
        >
          {run.text}
        </span>
      ))}
      {blurGroups(layout.glyphs, states, isPlain).map((group) => {
        const glyphs = group.glyphs.map((glyph) => {
          const state = states[glyph.index];
          const x = trackedX(glyph);
          const y = layout.lines[glyph.lineIndex].y;
          const [ox, oy] = pivot(glyph, x);
          return (
            <span
              key={glyph.index}
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: glyph.width,
                height: layout.lineHeightPx,
                whiteSpace: "pre",
                color: state.color,
                opacity: state.opacity,
                transformOrigin: `${ox}px ${oy}px`,
                transform: `translate(${x + state.dx}px, ${y + state.dy}px) rotate(${state.rotation}deg) skewX(${state.skew}deg) scale(${state.scale})`,
              }}
            >
              {shiftCharacter(glyph.char, state.charShift)}
            </span>
          );
        });
        if (group.blur === 0) return glyphs;
        return (
          <div
            key={group.key}
            style={{ position: "absolute", left: 0, top: 0, filter: `blur(${group.blur}px)` }}
          >
            {glyphs}
          </div>
        );
      })}
    </div>
  );
};

/** Blur is quantised to this step, in pixels, so neighbouring glyphs share one filter. */
const BLUR_STEP = 0.5;

type BlurGroup = { key: string; blur: number; glyphs: GlyphBox[] };

/**
 * Every CSS `filter` gets its own offscreen raster, and in a headless render
 * that — not the element count — is what a blurred reveal costs. Glyphs are
 * grouped by line and by blur rounded to half a pixel, and each group shares
 * one filter: a 100-glyph ramp needs ~16 filters instead of 100, and grouping
 * per line keeps each raster no bigger than the line segment it covers.
 */
function blurGroups(
  glyphs: readonly GlyphBox[],
  states: readonly GlyphState[],
  isPlain: (index: number) => boolean,
): BlurGroup[] {
  const groups = new Map<string, BlurGroup>();
  for (const glyph of glyphs) {
    const state = states[glyph.index];
    if (!state || state.opacity <= 0.001 || isPlain(glyph.index)) continue;
    const blur = state.blur > 0.05 ? Math.max(BLUR_STEP, Math.round(state.blur / BLUR_STEP) * BLUR_STEP) : 0;
    const key = `${glyph.lineIndex}:${blur}`;
    const group = groups.get(key);
    if (group) group.glyphs.push(glyph);
    else groups.set(key, { key, blur, glyphs: [glyph] });
  }
  return [...groups.values()];
}
