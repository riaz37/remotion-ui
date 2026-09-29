import { measureText } from "@remotion/layout-utils";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  interpolateColors,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { resolveAnimatable, type Animatable, type Vec2 } from "@/remotion/lib/ae-motion";
import { layoutGlyphs, type GlyphBox, type GlyphLayout } from "@/remotion/lib/glyph-layout";
import {
  evaluateSelectors,
  indexGlyphs,
  type SelectorBasis,
  type TextSelector,
} from "@/remotion/lib/text-selectors";

export type {
  RangeSelector,
  SelectorShape,
  TextSelector,
  WigglySelector,
} from "@/remotion/lib/text-selectors";

/**
 * Targets an animator pushes selected glyphs toward. A glyph with selection 1
 * gets the full value; 0.4 gets 40% of the way; 0 is untouched.
 */
export type AnimatorProperties = {
  /** Pixel offset. */
  position?: Animatable<Vec2>;
  /** Scale factor at full selection (1 = unchanged). */
  scale?: Animatable<number>;
  /** Degrees. */
  rotation?: Animatable<number>;
  /** Degrees of horizontal shear. */
  skew?: Animatable<number>;
  /** Opacity at full selection, 0–1. */
  opacity?: Animatable<number>;
  /** Gaussian blur in pixels. */
  blur?: Animatable<number>;
  /** Extra space after each glyph, in pixels. Pushes the rest of the line. */
  tracking?: Animatable<number>;
  /** Fill colour at full selection. */
  fill?: string;
  /** Shifts letters and digits through their alphabet (AE's Character Offset). */
  characterOffset?: Animatable<number>;
};

export type TextAnimatorLayer = {
  properties: AnimatorProperties;
  /** Combined top to bottom by each selector's mode. None selects everything. */
  selectors?: TextSelector[];
  /** What one selector unit is. */
  basedOn?: SelectorBasis;
};

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
  /** Render a specific frame instead of the current one. */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

type GlyphState = {
  dx: number;
  dy: number;
  scale: number;
  rotation: number;
  skew: number;
  opacity: number;
  blur: number;
  tracking: number;
  color: string;
  charShift: number;
};

const REFERENCE_SIZE = 100;
const DEFAULT_FAMILY = "Inter, system-ui, sans-serif";

/**
 * Holds the render until the face is available, then flips `ready`. Measuring
 * before the font arrives would measure the fallback face — and
 * `measureText` caches by string, so the wrong widths would stick.
 */
function useFontReady(fontFamily: string, fontWeight: number): boolean {
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
    pending.current = delayRender(`text-animator: loading ${fontWeight} ${fontFamily}`);
    Promise.all([
      document.fonts.load(`${fontWeight} ${REFERENCE_SIZE}px ${fontFamily}`),
      document.fonts.ready,
    ])
      .then(() => {
        if (!active) return;
        setReady(true);
        release();
      })
      .catch((error: unknown) => {
        release();
        cancelRender(error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      active = false;
      release();
    };
  }, [fontFamily, fontWeight, delayRender, cancelRender, release]);

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
  frame: frameOverride,
  style,
  className,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const frame = frameOverride ?? currentFrame;
  const fontSize = fontSizeProp ?? Math.round((84 * width) / 1080);
  const maxWidth = maxWidthProp ?? width * 0.84;
  const ready = useFontReady(fontFamily, fontWeight);

  const layout = useMemo<GlyphLayout | null>(() => {
    if (!ready) return null;
    // Measured once at a reference size and scaled: widths are linear in size,
    // and it keeps measureText's cache to one entry per string.
    const measure = (value: string, size: number) =>
      (measureText({
        text: value,
        fontFamily,
        fontSize: REFERENCE_SIZE,
        fontWeight: String(fontWeight),
      }).width *
        size) /
      REFERENCE_SIZE;
    return layoutGlyphs({ text, fontSize, maxWidth, letterSpacing, lineHeight, measure });
  }, [ready, text, fontFamily, fontWeight, fontSize, maxWidth, letterSpacing, lineHeight]);

  const states = useMemo<GlyphState[]>(() => {
    if (!layout) return [];
    const { glyphs: index, totals } = indexGlyphs(
      layout.lines.map((line) => line.words.map((word) => word.glyphs.map((glyph) => glyph.char))),
    );
    const base: GlyphState[] = layout.glyphs.map(() => ({
      dx: 0,
      dy: 0,
      scale: 1,
      rotation: 0,
      skew: 0,
      opacity: 1,
      blur: 0,
      tracking: 0,
      color,
      charShift: 0,
    }));
    const ctx = { frame, fps };
    const resolve = <V extends number | Vec2>(value: Animatable<V> | undefined, fallback: V): V =>
      value === undefined ? fallback : resolveAnimatable(value, frame, { fps });

    return animators.reduce((acc, animator) => {
      const basis = animator.basedOn ?? "characters";
      const selection = evaluateSelectors(animator.selectors ?? [], totals[basis], ctx);
      const p = animator.properties;
      const [px, py] = resolve(p.position, [0, 0] as Vec2);
      const scale = resolve(p.scale, 1);
      const rotation = resolve(p.rotation, 0);
      const skew = resolve(p.skew, 0);
      const opacity = resolve(p.opacity, 1);
      const blur = resolve(p.blur, 0);
      const tracking = resolve(p.tracking, 0);
      const shift = resolve(p.characterOffset, 0);

      return acc.map((state, i) => {
        const amount = selection[index[i][basis]] ?? 0;
        if (amount === 0) return state;
        const colorAmount = Math.min(1, Math.max(0, amount));
        return {
          dx: state.dx + px * amount,
          dy: state.dy + py * amount,
          scale: state.scale * (1 + (scale - 1) * amount),
          rotation: state.rotation + rotation * amount,
          skew: state.skew + skew * amount,
          opacity: state.opacity * Math.min(1, Math.max(0, 1 + (opacity - 1) * amount)),
          blur: state.blur + blur * amount,
          tracking: state.tracking + tracking * amount,
          color: p.fill ? interpolateColors(colorAmount, [0, 1], [state.color, p.fill]) : state.color,
          charShift: state.charShift + Math.round(shift * amount),
        };
      });
    }, base);
  }, [layout, animators, frame, fps, color]);

  if (!layout) {
    return <div aria-label={text} className={className} style={style} />;
  }

  const lineOffsets = layout.lines.map((line) => {
    // Animated tracking changes a line's width every frame; alignment follows
    // it, exactly as AE re-centres a line whose tracking is animating.
    const extra = line.glyphs.slice(0, -1).reduce((sum, g) => sum + (states[g.index]?.tracking ?? 0), 0);
    const lineWidth = line.width + extra;
    if (align === "left") return 0;
    if (align === "right") return layout.width - lineWidth;
    return (layout.width - lineWidth) / 2;
  });

  const trackedX = (glyph: GlyphBox) => {
    const line = layout.lines[glyph.lineIndex];
    let push = 0;
    for (const g of line.glyphs) {
      if (g.index >= glyph.index) break;
      push += states[g.index]?.tracking ?? 0;
    }
    return lineOffsets[glyph.lineIndex] + glyph.x + push;
  };

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
      {layout.glyphs.map((glyph) => {
        const state = states[glyph.index];
        if (!state || state.opacity <= 0.001) return null;
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
              filter: state.blur > 0.05 ? `blur(${state.blur.toFixed(2)}px)` : undefined,
              transformOrigin: `${ox}px ${oy}px`,
              transform: `translate(${x + state.dx}px, ${y + state.dy}px) rotate(${state.rotation}deg) skewX(${state.skew}deg) scale(${state.scale})`,
            }}
          >
            {shiftCharacter(glyph.char, state.charShift)}
          </span>
        );
      })}
    </div>
  );
};
