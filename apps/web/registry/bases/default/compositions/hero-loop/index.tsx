import { loadFont as loadDisplayFont } from "@remotion/google-fonts/Newsreader";
import { useMemo, useState, type CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Solid,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { makeShaderEffect } from "@/remotion/lib/gpu";

/**
 * hero-loop — a brand ident, animated from the logo's own anatomy.
 *
 * The RemotionUI lockup (tile, back frame, front frame, gold play triangle,
 * wordmark) holds over the site's phosphor light — gold halftone streaks
 * fanning up from below — and moves three times in 360 frames (12s @ 30fps):
 *
 *   hold · parallax frames 54-120 · hold · play press 166-214 · hold
 *   wordmark re-reveal 252-324 · hold to 360
 *
 * Every move is keyframed on custom bezier curves with anticipation and a
 * small overshoot, the icon leads and the wordmark follows, and every curve
 * lands exactly on its rest value, so the lockup at frame 324 is the lockup at
 * frame 0. The light behind it stays steady; its slow drift runs on a closed
 * path, one lap per loop, so the wrap is seamless. No text beyond the wordmark.
 */

const { fontFamily: displayFamily } = loadDisplayFont("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

/** Overall brightness of the phosphor light. Tuned so the wordmark never sits on its brightest streak. */
const LIGHT = 0.62;

const COLORS = {
  stage: "#060605",
  ink: "#ececec",
  phosphor: "#e8b86d",
  /** Mark geometry colours, straight from public/logo.svg. */
  plate: "#2a2928",
  window: "#050505",
} as const;

const LOOP_FRAMES = 360;
const WORDMARK = "RemotionUI";

/* ------------------------------------------------------------------------ */
/* Curves                                                                    */
/* ------------------------------------------------------------------------ */

/** Ease into a move: the anticipation and the push. */
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
/** Travel between keys. */
const EASE_MOVE = Easing.bezier(0.45, 0, 0.2, 1);
/** Settle: decelerates hard into the rest value. */
const EASE_SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

type Key = readonly [frame: number, value: number];

/**
 * Piecewise keyframes. The first segment eases in (anticipation), the last
 * settles, everything between travels. Outside the keys it holds the end
 * values, so a finished move is exactly at rest.
 */
function curve(frame: number, keys: readonly Key[]): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (frame <= first[0]) return first[1];
  if (frame >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame >= f0 && frame <= f1) {
      const t = (frame - f0) / Math.max(1e-6, f1 - f0);
      const ease =
        i === 0 ? EASE_IN : i === keys.length - 2 ? EASE_SETTLE : EASE_MOVE;
      return v0 + (v1 - v0) * ease(t);
    }
  }
  return last[1];
}

/** Rate of change per frame, used to blur only the genuinely fast frames. */
function speed(frame: number, keys: readonly Key[]): number {
  return Math.abs(curve(frame, keys) - curve(frame - 1, keys));
}

/* ------------------------------------------------------------------------ */
/* Choreography (absolute frames, logo.svg 32-unit space for the icon)       */
/* ------------------------------------------------------------------------ */

/** Moment 1 — parallax frames. */
const M1 = {
  backX: [[54, 0], [62, 0.35], [84, -2.4], [102, 0.25], [114, 0]],
  backY: [[54, 0], [62, 0.28], [84, -1.8], [102, 0.2], [114, 0]],
  frontX: [[54, 0], [62, -0.12], [84, 0.7], [102, -0.08], [114, 0]],
  frontY: [[54, 0], [62, -0.1], [84, 0.55], [102, -0.06], [114, 0]],
  tiltY: [[54, 0], [62, 1.2], [86, -8], [106, 0.8], [120, 0]],
  tiltX: [[54, 0], [62, -0.8], [86, 5], [106, -0.5], [120, 0]],
  tileScale: [[54, 1], [62, 0.99], [86, 1.02], [106, 0.998], [120, 1]],
} as const satisfies Record<string, readonly Key[]>;

/** Moment 2 — play press. */
const M2 = {
  tri: [[166, 1], [172, 1.07], [178, 0.74], [190, 1.1], [202, 0.97], [212, 1]],
  front: [[170, 1], [178, 0.985], [190, 1.008], [204, 1]],
  bloom: [[176, 0], [184, 1], [214, 0]],
} as const satisfies Record<string, readonly Key[]>;

/** Moment 3 — the tile catches the light, then the wordmark re-reveals. */
const M3 = {
  tiltX: [[252, 0], [258, -1], [276, 6], [300, -0.6], [314, 0]],
  tiltY: [[252, 0], [258, -0.6], [276, 3], [300, -0.3], [314, 0]],
} as const satisfies Record<string, readonly Key[]>;

/** One glint per moment that touches the tile: [start, end]. */
const GLINTS: readonly (readonly [number, number])[] = [
  [96, 114],
  [186, 204],
  [270, 290],
];

/** Wordmark follows moment 1 and 2 in sympathy, a few frames behind the icon. */
function letterSympathy(frame: number, index: number): number {
  const m1 = curve(frame - 6 - index, [[60, 0], [70, 0.012], [92, -0.04], [108, 0.006], [122, 0]]);
  const m2 = curve(frame - 8 - index, [[178, 0], [188, -0.02], [202, 0.004], [214, 0]]);
  return m1 + m2;
}

/** Moment 3 per letter: out behind the mask left to right, back in with blur-to-sharp. */
function letterReveal(frame: number, index: number): { y: number; blur: number } {
  const exit = 262 + index * 1.5;
  const enter = 284 + index * 2;
  const keys: readonly Key[] = [
    [exit, 0],
    [exit + 3, -0.06],
    [exit + 12, 1.12],
    [enter, 1.12],
    [enter + 14, -0.08],
    [enter + 22, 0],
  ];
  const blur = curve(frame, [[enter, 1], [enter + 12, 0]]) * (frame >= enter ? 1 : 0);
  return { y: curve(frame, keys), blur };
}

/* ------------------------------------------------------------------------ */
/* Composition                                                              */
/* ------------------------------------------------------------------------ */

type Metrics = {
  s: (size: number) => number;
  icon: number;
  gap: number;
  wordmark: number;
};

function useMetrics(): Metrics {
  const { width, height } = useVideoConfig();
  return useMemo(() => {
    const basis = Math.min(width, (height * 16) / 9);
    const s = (size: number) => Math.round(size * (basis / 1920));
    return { s, icon: s(250), gap: s(54), wordmark: s(168) };
  }, [width, height]);
}

export type HeroLoopBackground = "phosphor" | "transparent";

export type HeroLoopProps = {
  /**
   * `phosphor` (default) paints the stage and the site's gold light, for
   * renders, the poster, docs and the README. `transparent` paints no stage at
   * all, only the lockup and a soft well, so a page can show its own live light
   * through the video — the homepage monitor does this.
   */
  background?: HeroLoopBackground;
  /**
   * Page theme the transparent variant sits on. `light` inks the wordmark dark
   * and lifts the well to the page colour so the lockup reads on #f7f5f1.
   * Ignored by the phosphor background, which is always dark.
   */
  tone?: "dark" | "light";
};

/** Ink and well colours for the transparent variant on each page theme. */
const TONES = {
  dark: { ink: "#ececec", well: "6, 6, 5" },
  light: { ink: "#1c1a17", well: "247, 245, 241" },
} as const;

export const HeroLoop: React.FC<HeroLoopProps> = ({
  background = "phosphor",
  tone = "dark",
}) => {
  const m = useMetrics();
  const transparent = background === "transparent";
  const palette = TONES[transparent ? tone : "dark"];
  return (
    <AbsoluteFill style={transparent ? undefined : { backgroundColor: COLORS.stage }}>
      {transparent ? null : <PhosphorLight />}
      <CentreWell soft={transparent} rgb={palette.well} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: m.gap }}>
          <Tile m={m} />
          <Wordmark m={m} ink={palette.ink} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------ */
/* The tile: back frame, front frame and triangle move as separate parts    */
/* ------------------------------------------------------------------------ */

const TRIANGLE_CENTRE = [17, 17] as const;
const FRONT_CENTRE = [18, 16.5] as const;

const Tile: React.FC<{ m: Metrics }> = ({ m }) => {
  const frame = useCurrentFrame();

  const tiltX = curve(frame, M1.tiltX) + curve(frame, M3.tiltX);
  const tiltY = curve(frame, M1.tiltY) + curve(frame, M3.tiltY);
  const tileScale = curve(frame, M1.tileScale);

  const backX = curve(frame, M1.backX);
  const backY = curve(frame, M1.backY);
  const frontX = curve(frame, M1.frontX);
  const frontY = curve(frame, M1.frontY);
  const frontScale = curve(frame, M2.front);
  const tri = curve(frame, M2.tri);
  const bloom = curve(frame, M2.bloom);

  // Motion blur only while the press is genuinely fast.
  const triSpeed = speed(frame, M2.tri);
  const triBlur = triSpeed > 0.025 ? Math.min(0.35, (triSpeed - 0.025) * 6) : 0;

  const scaleAbout = ([cx, cy]: readonly [number, number], k: number) =>
    `translate(${cx} ${cy}) scale(${k.toFixed(5)}) translate(${-cx} ${-cy})`;

  const glint = glintAt(frame);

  const style: CSSProperties = {
    position: "relative",
    width: m.icon,
    height: m.icon,
    flexShrink: 0,
    transform: `perspective(1400px) rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg) scale(${tileScale.toFixed(5)})`,
  };

  return (
    <div style={style}>
      <svg
        width={m.icon}
        height={m.icon}
        viewBox="0 0 32 32"
        fill="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <rect width={32} height={32} rx={6} fill={COLORS.plate} />
        <g transform="translate(-1.5 -1)">
          <g transform={`translate(${backX.toFixed(4)} ${backY.toFixed(4)})`}>
            <rect x={5} y={6} width={18} height={13} rx={3} stroke={COLORS.ink} strokeWidth={1.25} fill="none" opacity={0.35} />
          </g>
          <g
            transform={`translate(${frontX.toFixed(4)} ${frontY.toFixed(4)}) ${scaleAbout(FRONT_CENTRE, frontScale)}`}
          >
            <rect x={9} y={10} width={18} height={13} rx={3} fill={COLORS.window} stroke={COLORS.ink} strokeWidth={1.5} opacity={0.95} />
            <g transform={scaleAbout(TRIANGLE_CENTRE, tri)}>
              <path
                d="M15.5 14.5v5l4.5-2.5-4.5-2.5z"
                fill={COLORS.phosphor}
                style={{
                  filter: [
                    `drop-shadow(0 0 ${m.s(14 + 30 * bloom)}px rgba(255, 196, 110, ${(0.6 + 0.4 * bloom).toFixed(3)}))`,
                    triBlur > 0.01 ? `blur(${(triBlur * m.s(8)).toFixed(2)}px)` : "",
                  ]
                    .filter(Boolean)
                    .join(" "),
                }}
              />
            </g>
          </g>
        </g>
      </svg>
      {glint >= 0 ? <TileGlint m={m} progress={glint} /> : null}
    </div>
  );
};

function glintAt(frame: number): number {
  for (const [start, end] of GLINTS) {
    if (frame >= start && frame <= end) {
      return EASE_MOVE((frame - start) / (end - start));
    }
  }
  return -1;
}

/** One specular band crossing the tile, clipped to its rounded plate. */
const TileGlint: React.FC<{ m: Metrics; progress: number }> = ({ m, progress }) => {
  const x = -60 + progress * 220;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: (m.icon * 6) / 32,
        overflow: "hidden",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: Math.sin(progress * Math.PI) * 0.75,
        background: `linear-gradient(105deg, rgba(255,236,200,0) ${x - 16}%, rgba(255,236,200,0.5) ${x}%, rgba(255,236,200,0) ${x + 16}%)`,
      }}
    />
  );
};

/* ------------------------------------------------------------------------ */
/* The wordmark: per-letter, masked                                          */
/* ------------------------------------------------------------------------ */

const Wordmark: React.FC<{ m: Metrics; ink: string }> = ({ m, ink }) => {
  const frame = useCurrentFrame();
  const pad = m.wordmark * 0.18;

  return (
    <div
      style={{
        fontFamily: displayFamily,
        fontWeight: 600,
        fontSize: m.wordmark,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color: ink,
        whiteSpace: "nowrap",
        display: "flex",
        // The mask: letters leave and return through this edge.
        clipPath: `inset(${-pad}px ${-pad}px 0px ${-pad}px)`,
        paddingBottom: pad * 0.4,
      }}
    >
      {WORDMARK.split("").map((letter, index) => {
        const reveal = letterReveal(frame, index);
        const lift = letterSympathy(frame, index);
        const y = (reveal.y + lift) * m.wordmark;
        return (
          <span
            key={`${letter}-${index}`}
            style={{
              display: "inline-block",
              translate: `0px ${y.toFixed(2)}px`,
              filter:
                reveal.blur > 0.02
                  ? `blur(${(reveal.blur * m.s(10)).toFixed(2)}px)`
                  : undefined,
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* Background: the site's phosphor light, as the video's own copy           */
/* ------------------------------------------------------------------------ */

/**
 * A darker well under the lockup so the wordmark always sits on near-black.
 * Over a live page light it is softer and wider, so it reads as shade, not as
 * a box behind the logo.
 */
const CentreWell: React.FC<{ soft?: boolean; rgb: string }> = ({ soft = false, rgb }) => (
  <AbsoluteFill
    style={{
      background: soft
        ? `radial-gradient(ellipse 46% 30% at 50% 50%, rgba(${rgb}, 0.62) 0%, rgba(${rgb}, 0.4) 50%, rgba(${rgb}, 0) 100%)`
        : `radial-gradient(ellipse 40% 20% at 50% 50%, rgba(${rgb}, 0.9) 0%, rgba(${rgb}, 0.72) 45%, rgba(${rgb}, 0) 100%)`,
    }}
  />
);

/**
 * Ported from components/landing/phosphor-field-shaders.ts and folded into one
 * pass: the halftone samples the light field directly at each cell centre
 * instead of reading a framebuffer, so it runs as a single `lib/gpu` effect.
 * Driven by frame, not clock: the noise drifts round a closed circle once per
 * loop and the breathing runs twice per loop, so the light loops seamlessly.
 * The per-frame grain is left out on purpose — it is uncorrelated between
 * frames, which made the wrap measure as a jump.
 */
const PHOSPHOR_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uResolution;
uniform float uPhase;
uniform float uLight;
out vec4 outColor;

const float DEG = 0.01745329252;
const float TAU = 6.28318530718;
const vec3 STAGE = vec3(0.0235, 0.0235, 0.0196);
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float ANGLE = 0.52;

vec3 oklchToLinear(float L, float C, float h) {
  float a = C * cos(h), b = C * sin(h);
  vec3 lms = vec3(
    L + 0.3963377774 * a + 0.2158037573 * b,
    L - 0.1055613458 * a - 0.0638541728 * b,
    L - 0.0894841775 * a - 1.2914855480 * b
  );
  lms = lms * lms * lms;
  return mat3(4.0767416621, -1.2684380046, -0.0041960863,
              -3.3077115913, 2.6097574011, -0.7034186147,
              0.2309699292, -0.3413193965, 1.7076147010) * lms;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = turn * p;
    amp *= 0.5;
  }
  return value;
}

vec3 field(vec2 px) {
  vec2 pos = (px - 0.5 * uResolution) / uResolution.y;
  vec2 d = pos - vec2(0.0, -0.66);
  float r = length(d);
  float angle = atan(d.x, d.y);

  float th = uPhase * TAU;
  vec2 loop = vec2(cos(th), sin(th));

  float fan = smoothstep(1.2, 0.36, abs(angle));
  float lobes = mix(0.3, 1.0, smoothstep(0.06, 0.5, abs(angle)));

  float warp = fbm(vec2(angle * 3.2 + loop.x * 0.35, r * 0.7 + loop.y * 0.35));
  float streak = fbm(vec2(angle * 6.5 + warp * 1.6 + loop.y * 0.22, r * 0.15 + loop.x * 0.22));
  streak = pow(smoothstep(0.26, 0.8, streak), 1.8);

  float body = exp(-r * 0.78);
  float haze = exp(-r * 1.6) * 0.38;
  float breath = 0.92 + 0.08 * sin(th * 2.0);
  float intensity = (streak * 1.7 * body + haze) * fan * lobes * breath;

  float k = clamp(r * 0.65 + (warp - 0.5) * 0.7, 0.0, 1.0);
  float hue = mix(52.0, 80.0, k);
  hue = mix(hue, 30.0, smoothstep(0.6, 1.2, abs(angle)) * 0.55);
  vec3 tint = clamp(oklchToLinear(0.84 - 0.1 * k, 0.14, hue * DEG), 0.0, 1.0);

  vec3 x = tint * intensity * 1.85 * uLight;
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return clamp(mapped, 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;

  // Dot pitch tracks the render height, so the screen reads the same at any
  // output size, and never falls under a pixel and aliases.
  float cell = max(2.5, 4.8 * uResolution.y / 1080.0);

  // The screen is a lattice, not a grid of squares: two cell-length basis
  // vectors turned off-axis. Walking the basis gives the nearest node back in
  // pixels directly, so nothing has to be rotated out of screen space again.
  vec2 e0 = cell * vec2(cos(ANGLE), sin(ANGLE));
  vec2 e1 = vec2(-e0.y, e0.x);
  vec2 lattice = vec2(dot(frag, e0), dot(frag, e1)) / (cell * cell);
  vec2 node = floor(lattice) + 0.5;
  vec2 centre = node.x * e0 + node.y * e1;

  vec3 soft = field(frag);
  vec3 cellInk = field(centre);
  float tone = clamp(dot(cellInk, LUMA), 0.0, 1.0);

  // A screen is a threshold against a spot function, not a circle of measured
  // area: ink lands wherever the cone standing on the node rises above the
  // tone that cell owes. The spot falls one unit per \`reach\` pixels, so
  // 1/reach is a one-pixel feather.
  float reach = cell * 0.62;
  float spot = 1.0 - length(frag - centre) / reach;
  float aa = 1.0 / reach;
  float inked = smoothstep(-aa, aa, spot - (1.0 - tone));

  // The screen modulates the light already there rather than reprinting it as
  // fresh ink, so exposure is held by dividing out the mask's own mean: the
  // spot covers pi*reach^2*tone^2 of its cell, and whatever the screen has not
  // bitten into stays at full soft light. The feather prints a disc wider than
  // its nominal radius, so the coverage term uses the effective reach measured
  // off the loop (0.68) rather than 0.62; with the nominal figure the field
  // renders about 15% hot. Dim cells keep their soft light - a screen only
  // asserts itself once it carries some tone.
  float bite = 0.62 * smoothstep(0.0, 0.14, tone);
  float coverage = clamp(1.452 * tone * tone, 0.0, 1.0);
  float gain = 1.0 / max(1.0 - bite + bite * coverage, 1e-3);
  vec3 ink = clamp(soft * mix(1.0, inked, bite) * gain, 0.0, 1.0);

  // Light on a dark stage adds: the photographic screen op.
  outColor = vec4(clamp(1.0 - (1.0 - STAGE) * (1.0 - ink), 0.0, 1.0), 1.0);
}
`;

type PhosphorParams = { readonly phase: number; readonly light: number };

const phosphorLight = makeShaderEffect<PhosphorParams>({
  type: "dev.remotionui.hero-loop.phosphorLight",
  label: "phosphorLight()",
  fragmentShader: PHOSPHOR_SHADER,
  calculateKey: (p) => `phosphor-${p.phase.toFixed(5)}-${p.light.toFixed(4)}`,
  setUniforms: (gl, program, p) => {
    gl.uniform1f(gl.getUniformLocation(program, "uPhase"), p.phase);
    gl.uniform1f(gl.getUniformLocation(program, "uLight"), p.light);
  },
});

/**
 * WebGL2 is checked once. Without it the light is skipped and the flat stage
 * and well remain, the same fallback the site's own phosphor field uses.
 */
function useWebGl2(): boolean {
  const [available] = useState(() => {
    if (typeof document === "undefined") return false;
    try {
      return Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      return false;
    }
  });
  return available;
}

/** Steady light: it drifts on its own clock and does not react to the logo. */
const PhosphorLight: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const webgl = useWebGl2();
  if (!webgl) return null;

  return (
    <AbsoluteFill>
      <Solid
        width={width}
        height={height}
        color={COLORS.stage}
        effects={[phosphorLight({ phase: frame / LOOP_FRAMES, light: LIGHT })]}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
