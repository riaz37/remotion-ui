import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * The GitHub README hero.
 *
 * This is a marketing asset, not a registry component — nobody installs it, so
 * it lives in `showcase/` and never reaches `registry.json` (which is fixed at
 * 206 and is the number the README quotes).
 *
 * It deliberately replaces the old `hero-loop` re-encode, which shipped as a
 * 700x394 lossy animated WebP and visibly macroblocked. Two separate causes,
 * and both are designed out here rather than compressed around:
 *
 * 1. Resolution. The README renders at `width=700`, so a 700px canvas is
 *    upscaled on every HiDPI display. This composition is authored at 1400x788
 *    and downscaled by the browser instead.
 * 2. Content vs codec. `hero-loop` is a large, smooth, dark gradient field, and
 *    that is the single worst thing to hand a lossy block-transform codec —
 *    gentle luminance ramps across a big flat area are exactly what bands. So
 *    there is not one gradient, glow, blur, shadow or grain in this file. Every
 *    pixel is a flat fill, a solid shape, or crisp type, all of which survive
 *    compression (and, at the sizes involved here, encode losslessly).
 *
 * Seamless looping is structural, not eyeballed. It autoplays forever with no
 * controls, so a seam or a frozen tail is extremely obvious. Every animated
 * quantity below is periodic in `frame % HALF_CYCLE`, and the only piece of
 * *state* (which glyph a tile is showing) is a parity that advances exactly
 * twice across the 100-frame loop and therefore returns to its starting value.
 */

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMonoFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

/**
 * 1400x788 is 2x the README's 700x394 display box, and 788 keeps both axes even
 * so the intermediate render has no chroma-subsampling edge case.
 *
 * 25fps is not the repo's usual 30: animated WebP frame delays are whole
 * milliseconds, and 25fps is exactly 40ms. At 30fps the delay rounds to 33ms
 * and the loop drifts ~10ms per cycle against the composition length. Authoring
 * at the delivery rate also means the encoder never resamples, so no frame is
 * dropped or duplicated on the way out.
 */
export const README_HERO_FPS = 25;
export const README_HERO_DURATION = 100;
export const README_HERO_WIDTH = 1400;
export const README_HERO_HEIGHT = 788;

/**
 * Half a loop. The flip wave crosses the grid once per half-cycle, so it
 * crosses twice per loop and every tile toggles A -> B -> A.
 */
const HALF_CYCLE = README_HERO_DURATION / 2;
/** Frames between one tile starting its flip and the next. */
const TILE_STAGGER = 5;
/** Length of a single tile's flip. Must satisfy 5*STAGGER + FLIP < HALF_CYCLE. */
const FLIP_FRAMES = 16;
/** Cursor blink period. 100 / 25 = 4 whole cycles per loop. */
const BLINK_PERIOD = 25;
const BLINK_ON_FRAMES = 13;

const COLOR = {
  stage: "#0A0A0A",
  tile: "#151413",
  border: "#2A2928",
  accent: "#E8B86D",
  text: "#F5F5F4",
  muted: "#A8A29E",
  glyph: "#6B6663",
} as const;

/** Flat redraw of `apps/web/public/logo.svg`. */
const MARK = {
  plate: "#2A2928",
  frame: "#ECECEC",
  window: "#050505",
} as const;

const GRID = {
  originX: 712,
  originY: 241,
  tileWidth: 188,
  tileHeight: 140,
  gap: 25,
  columns: 3,
  rows: 2,
} as const;

const GLYPH_VIEWBOX_WIDTH = 120;
const GLYPH_VIEWBOX_HEIGHT = 72;
const GLYPH_WIDTH = 112;
const GLYPH_HEIGHT = 67;

type GlyphKind =
  | "bars"
  | "wave"
  | "lines"
  | "caption"
  | "card"
  | "frame"
  | "split"
  | "grid"
  | "play"
  | "dots";

/**
 * Each tile alternates between two glyphs. Pairs are chosen so that no two
 * tiles ever show the same glyph at the same time: a glyph used as an "A" on
 * one tile is only ever used as a "B" on another, and A/B states occupy
 * opposite halves of the loop.
 */
const TILE_GLYPHS: ReadonlyArray<readonly [GlyphKind, GlyphKind]> = [
  ["bars", "wave"],
  ["lines", "caption"],
  ["card", "frame"],
  ["split", "grid"],
  ["play", "dots"],
  ["frame", "play"],
];

const Glyph: React.FC<{ kind: GlyphKind }> = ({ kind }) => {
  const common = {
    width: GLYPH_WIDTH,
    height: GLYPH_HEIGHT,
    viewBox: `0 0 ${GLYPH_VIEWBOX_WIDTH} ${GLYPH_VIEWBOX_HEIGHT}`,
    fill: "none" as const,
  };

  switch (kind) {
    case "bars": {
      const heights = [30, 54, 38, 64];
      return (
        <svg {...common}>
          {heights.map((height, index) => (
            <rect
              key={index}
              x={6 + index * 30}
              y={72 - height}
              width={18}
              height={height}
              rx={3}
              fill={index === 1 ? COLOR.accent : COLOR.glyph}
            />
          ))}
        </svg>
      );
    }
    case "wave": {
      const heights = [18, 34, 52, 68, 52, 34, 18];
      return (
        <svg {...common}>
          {heights.map((height, index) => (
            <rect
              key={index}
              x={6 + index * 17}
              y={36 - height / 2}
              width={8}
              height={height}
              rx={4}
              fill={index === 3 ? COLOR.accent : COLOR.glyph}
            />
          ))}
        </svg>
      );
    }
    case "lines": {
      const widths = [120, 88, 56];
      return (
        <svg {...common}>
          {widths.map((width, index) => (
            <rect
              key={index}
              x={0}
              y={8 + index * 22}
              width={width}
              height={12}
              rx={4}
              fill={index === 0 ? COLOR.accent : COLOR.glyph}
            />
          ))}
        </svg>
      );
    }
    case "caption":
      return (
        <svg {...common}>
          <rect x={0} y={0} width={120} height={40} rx={5} fill={COLOR.glyph} />
          <rect x={24} y={54} width={72} height={12} rx={4} fill={COLOR.accent} />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x={0} y={0} width={120} height={36} rx={5} fill={COLOR.glyph} />
          <rect x={0} y={46} width={84} height={10} rx={4} fill={COLOR.glyph} />
          <rect x={0} y={62} width={52} height={10} rx={4} fill={COLOR.accent} />
        </svg>
      );
    case "frame":
      return (
        <svg {...common}>
          <rect
            x={3}
            y={3}
            width={114}
            height={66}
            rx={9}
            stroke={COLOR.glyph}
            strokeWidth={6}
          />
          <rect x={38} y={31} width={44} height={10} rx={4} fill={COLOR.accent} />
        </svg>
      );
    case "split":
      return (
        <svg {...common}>
          <rect x={0} y={0} width={56} height={72} rx={5} fill={COLOR.glyph} />
          <rect x={64} y={0} width={56} height={72} rx={5} fill={COLOR.accent} />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          {[
            [0, 0],
            [68, 0],
            [0, 40],
            [68, 40],
          ].map(([x, y], index) => (
            <rect
              key={index}
              x={x}
              y={y}
              width={52}
              height={32}
              rx={5}
              fill={index === 3 ? COLOR.accent : COLOR.glyph}
            />
          ))}
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <rect
            x={3}
            y={3}
            width={114}
            height={66}
            rx={9}
            stroke={COLOR.glyph}
            strokeWidth={6}
          />
          <path d="M48 20v32l28-16-28-16z" fill={COLOR.accent} />
        </svg>
      );
    case "dots":
      return (
        <svg {...common}>
          {[20, 60, 100].map((cx, index) => (
            <circle
              key={cx}
              cx={cx}
              cy={36}
              r={14}
              fill={index === 1 ? COLOR.accent : COLOR.glyph}
            />
          ))}
        </svg>
      );
  }
};

/**
 * One flat tile that flips edge-on and comes back carrying the other glyph.
 *
 * `waveIndex` orders the sweep, not the layout: it is `column * rows + row`, so
 * the wave reads as a left-to-right pass across the grid rather than as two
 * separate rows firing in sequence.
 */
const Tile: React.FC<{ waveIndex: number; glyphs: readonly [GlyphKind, GlyphKind] }> = ({
  waveIndex,
  glyphs,
}) => {
  const frame = useCurrentFrame();

  const elapsed = frame - waveIndex * TILE_STAGGER;
  // Math.floor (not trunc) so the negative frames at the head of the loop land
  // on the same parity the tail does — this is what keeps frame 0 and frame 100
  // identical instead of one-flip apart.
  const completedHalfCycles = Math.floor(elapsed / HALF_CYCLE);
  const local = elapsed - completedHalfCycles * HALF_CYCLE;

  const progress = interpolate(local, [0, FLIP_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // cos sweeps 1 -> 0 -> -1; the absolute value is the edge-on card flip.
  const scaleX = Math.abs(Math.cos(progress * Math.PI));
  // Swap content while the tile is edge-on, so the change is never seen.
  const showsSecondGlyph = progress >= 0.5;
  const parity = (((completedHalfCycles + (showsSecondGlyph ? 1 : 0)) % 2) + 2) % 2;

  const isFlipping = progress > 0.1 && progress < 0.9;

  return (
    <div
      style={{
        width: GRID.tileWidth,
        height: GRID.tileHeight,
        backgroundColor: COLOR.tile,
        border: `2px solid ${isFlipping ? COLOR.accent : COLOR.border}`,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scaleX(${scaleX})`,
      }}
    >
      <Glyph kind={glyphs[parity]} />
    </div>
  );
};

const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
    <rect width={32} height={32} rx={6} fill={MARK.plate} />
    <g transform="translate(-1.5 -1)">
      <rect
        x={5}
        y={6}
        width={18}
        height={13}
        rx={3}
        stroke={MARK.frame}
        strokeWidth={1.25}
        opacity={0.35}
      />
      <rect
        x={9}
        y={10}
        width={18}
        height={13}
        rx={3}
        fill={MARK.window}
        stroke={MARK.frame}
        strokeWidth={1.5}
        opacity={0.95}
      />
      <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill={COLOR.accent} />
    </g>
  </svg>
);

/**
 * The identity column. Held completely static on purpose: the brand has to be
 * legible on the first frame a reader lands on (there are no controls and no
 * scrubbing), and a motionless half of the canvas costs almost nothing in
 * inter-frame deltas, which buys quality for the half that does move.
 *
 * The one exception is the cursor, whose blink period divides the loop exactly.
 */
const IdentityColumn: React.FC = () => {
  const frame = useCurrentFrame();
  const cursorVisible = frame % BLINK_PERIOD < BLINK_ON_FRAMES;

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 0,
        width: 600,
        height: README_HERO_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <LogoMark size={76} />
        <div
          style={{
            fontFamily,
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: -1.6,
            lineHeight: 1,
            color: COLOR.text,
          }}
        >
          RemotionUI
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          fontFamily,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1.3,
          color: COLOR.muted,
        }}
      >
        206 copy-paste components for Remotion
      </div>

      <div
        style={{
          marginTop: 34,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 20px",
          backgroundColor: COLOR.tile,
          border: `2px solid ${COLOR.border}`,
          borderRadius: 12,
          fontFamily: monoFamily,
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: COLOR.text }}>npx remotion-ui@latest add </span>
        <span style={{ color: COLOR.accent, marginLeft: -10 }}>social-clip</span>
        <span
          style={{
            width: 11,
            height: 24,
            backgroundColor: COLOR.accent,
            opacity: cursorVisible ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};

export const ReadmeHero: React.FC = () => {
  const { width, height } = useVideoConfig();

  // Authored against a fixed 1400x788 stage and scaled as a unit, so the layout
  // cannot drift if this is ever rendered at another size for a still.
  const scale = Math.min(width / README_HERO_WIDTH, height / README_HERO_HEIGHT);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.stage }}>
      <div
        style={{
          position: "absolute",
          left: (width - README_HERO_WIDTH * scale) / 2,
          top: (height - README_HERO_HEIGHT * scale) / 2,
          width: README_HERO_WIDTH,
          height: README_HERO_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <IdentityColumn />

        {Array.from({ length: GRID.columns * GRID.rows }, (_, index) => {
          const column = index % GRID.columns;
          const row = Math.floor(index / GRID.columns);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: GRID.originX + column * (GRID.tileWidth + GRID.gap),
                top: GRID.originY + row * (GRID.tileHeight + GRID.gap),
              }}
            >
              <Tile waveIndex={column * GRID.rows + row} glyphs={TILE_GLYPHS[index]} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
