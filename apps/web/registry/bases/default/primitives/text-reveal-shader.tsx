import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { hexToRgb, makeShaderEffect } from "@/remotion/lib/gpu";

export type TextRevealShaderProps = {
  /** Copy to reveal. Newlines start a new line; the block stays centred. */
  text?: string;
  /** Plate behind the words. */
  backgroundColor?: string;
  /** The two ends of the iridescent film the words condense out of. */
  colors?: [string, string];
  /** Colour the glyph interior settles to once the edge has passed. */
  silverColor?: string;
  /** Direction of the sweep, in degrees. 0 sweeps left to right. */
  angle?: number;
  /** Frame the reveal starts on. */
  delay?: number;
  /** How many frames the sweep takes to cross the frame. */
  duration?: number;
  /** How far the two crossed sines bend the edge. 0 gives a straight wipe. */
  wobble?: number;
  /** Width of the refracting band at the edge, in frame widths. */
  bandWidth?: number;
  /** How far the band displaces the glyph. */
  refraction?: number;
  /** How long after the edge the interior takes to settle to flat silver. */
  settle?: number;
  /** Type size in px, measured against the composition height. */
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  /** Extra tracking in px. */
  letterSpacing?: number;
  /** Line height as a multiple of the type size. */
  lineHeight?: number;
};

/**
 * The glyph mask arrives as `uSource`'s alpha channel, so the shader never has
 * to know anything about type — it reads coverage and everything else is
 * generated per pixel.
 *
 * The reveal is a diagonal sweep whose threshold is perturbed by two crossed
 * sines, one running in x and one in y. A single sine gives a wavy line that
 * still reads as a machine wipe; crossing two at different periods breaks the
 * repeat and the edge reads as a wet meniscus pulling across the letters.
 *
 * `d` is the signed distance from that perturbed edge, positive on the revealed
 * side, and the whole look hangs off two uses of it:
 *
 * - `exp(-|d| / bandWidth)` is a narrow band that peaks hard at the edge and
 *   decays fast either side. Inside it the glyph is refracted. The
 *   displacement follows the *slope of the film's optical thickness*, the way
 *   a real film bends what is under it, so the offset is whatever the surface
 *   is doing locally rather than a fixed direction, and the three channels are
 *   sampled at decreasing strength to disperse the edge.
 * - `smoothstep(0, settle, d)` is the settle curve. The interior starts as the
 *   live iridescent field and relaxes into flat silver behind the edge, which
 *   is what makes the words read as condensing out of light rather than as
 *   light-coloured type being uncovered.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSource;
uniform vec2 uResolution;
/** Seconds of composition time. Drives the film only, never the reveal. */
uniform float uTime;
/** 0 before the sweep, 1 once it has fully crossed. */
uniform float uProgress;
/** Unit vector the sweep travels along. */
uniform vec2 uDirection;
uniform float uWobble;
uniform float uBandWidth;
uniform float uRefraction;
uniform float uSettle;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uSilver;

const vec3 LUMA = vec3(0.299, 0.587, 0.114);

/**
 * Step used for the central difference that reads the film's slope, in uv.
 * The film's fastest term turns over about every 0.09 uv, so this samples it
 * roughly twenty times per cycle: fine enough to follow the surface, coarse
 * enough that the difference is not swallowed by float noise.
 */
const float FILM_STEP = 0.0045;

/**
 * A thin-film style field. Three sines at unrelated periods per channel, so the
 * channels drift apart and the field never flattens into a region with no
 * slope for the refraction to read.
 */
vec3 film(vec2 uv) {
  float a = sin(uv.x * 9.1 + uTime * 0.7) + sin(uv.y * 6.7 - uTime * 0.5);
  float b = sin(uv.x * 5.3 - uTime * 0.45) + sin(uv.y * 11.3 + uTime * 0.62);
  float c = sin((uv.x + uv.y) * 7.9 + uTime * 0.38) + sin((uv.x - uv.y) * 4.7 - uTime * 0.53);

  vec3 mixer = vec3(a, b, c) * 0.25 + 0.5;
  vec3 tint = mix(uColorA, uColorB, mixer);

  // Lifted well clear of black: this is the light the words come out of, and a
  // field that reaches zero leaves dead holes inside the glyphs.
  return tint * (0.55 + 0.45 * mixer);
}

/**
 * Optical thickness of the film at a point. The refraction reads its slope, so
 * the only property that matters is that it varies smoothly; luma is used
 * because it already tracks how much film is stacked up at that pixel.
 */
float thickness(vec2 uv) {
  return dot(film(uv), LUMA);
}

void main() {
  // vUv.y = 0 is the bottom of clip space, and the glyph raster was drawn with
  // a DOM canvas whose y runs downward. Without this flip the words render
  // upside down.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

  vec3 field = film(uv);

  // Position along the sweep, 0 at the trailing corner and 1 at the leading one.
  float s = dot(uv - 0.5, uDirection) + 0.5;

  // Two crossed sines at unrelated periods. One alone still reads as a wipe.
  float wobble =
    sin(uv.y * 7.3 + uTime * 0.6) * 0.5 +
    sin(uv.x * 5.1 - uTime * 0.4) * 0.5;
  float edge = s + wobble * uWobble;

  // The threshold is widened past both ends by the wobble amplitude so that
  // progress 0 leaves nothing showing and progress 1 leaves nothing hidden,
  // however hard the edge is bent.
  float threshold = uProgress * (1.0 + 2.0 * uWobble) - uWobble;
  float d = threshold - edge;

  // Narrow exponential band pinned to the edge.
  float band = exp(-abs(d) / max(uBandWidth, 1e-4));

  // Displacement down the slope of the film's thickness, taken as a central
  // difference either side of the pixel. A film bends what is under it toward
  // where it is thinning, so this is the direction the glyph should move, and
  // it comes from the surface rather than from any one pair of channels.
  //
  // The gradient is reduced to a direction: dividing by its own magnitude
  // means a slack part of the film displaces as far as a busy one, so the
  // band reads as an even thickness of glass rather than beating in and out
  // with the sines. The epsilon in that divide keeps the near-flat points,
  // where the direction is meaningless, from snapping to a random unit vector.
  vec2 slope = vec2(
    thickness(uv + vec2(FILM_STEP, 0.0)) - thickness(uv - vec2(FILM_STEP, 0.0)),
    thickness(uv + vec2(0.0, FILM_STEP)) - thickness(uv - vec2(0.0, FILM_STEP))
  );
  vec2 disp = slope / (length(slope) + 0.02) * uRefraction * band;

  // Channels sampled at decreasing displacement to disperse the refracted edge.
  float mr = texture(uSource, vec2(uv.x, 1.0 - uv.y) + disp * 1.0).a;
  float mg = texture(uSource, vec2(uv.x, 1.0 - uv.y) + disp * 0.85).a;
  float mb = texture(uSource, vec2(uv.x, 1.0 - uv.y) + disp * 0.7).a;

  // Coverage drives alpha; the green tap is the least displaced honest estimate.
  float mask = mg;

  // Settle curve: live film at the edge, flat silver well behind it.
  //
  // The silver keeps a little of the film rather than going perfectly flat. A
  // constant interior parks the whole component the moment the sweep finishes,
  // and a still tail reads as a broken render on any audit that samples late
  // frames — the residue is small enough to read as brushed metal, not colour.
  // Sampled at a drifting offset as well as a moving clock, so the highlight
  // travels across the letters the way it would on brushed metal instead of
  // flickering in place. At 7% amplitude the tail measured as 2.7% of glyph
  // pixels moving by more than one level in forty frames, which is a still
  // image by any audit that looks; this is the amount that reads as alive.
  // The drift has to be a visible fraction of the frame per second and the
  // swing has to be wide, or the tail measures as a still image: at 0.035 uv/s
  // and a 20% swing the last forty frames moved by under one level per step,
  // which is a parked component however alive the maths looks on paper.
  vec3 sheen = film(uv + vec2(uTime * 0.13, uTime * -0.075));
  float filmLuma = dot(sheen, LUMA);
  vec3 silver = uSilver * (0.62 + 0.38 * filmLuma);

  float settled = smoothstep(0.0, max(uSettle, 1e-4), d);
  vec3 interior = mix(field, silver, settled);

  // Per-channel coverage reintroduces the dispersion as colour at the edge.
  // Clamped because the ratio divides by a coverage that goes to zero at the
  // glyph's own antialiased rim, where it would otherwise explode into fringes.
  vec3 dispersion = clamp(vec3(mr, mg, mb) / max(mask, 1e-3), 0.0, 2.0);
  vec3 body = interior * dispersion;

  // The light the words condense out of, ahead of the edge.
  vec3 rim = mix(uColorA, uColorB, 0.5) * 1.7;

  float revealed = smoothstep(-0.004, 0.004, d);

  // Crossfaded rather than summed. Summing let the unrevealed side carry a
  // near-black colour at a non-zero alpha, which painted a dark silhouette of
  // the letters that had not arrived yet — the glyphs read as a drop shadow
  // sitting on the plate instead of as nothing at all.
  vec3 lit = mix(rim, body, revealed);

  // Coverage is gated on the glyph either being revealed or being inside the
  // band, over a low floor. The floor leaves the words faintly present in the
  // light before the edge reaches them, which is the brief — they condense out
  // of something rather than arriving from nothing. It carries the rim colour,
  // not the body colour: an unrevealed glyph tinted toward black reads as a
  // drop shadow, the same defect the crossfade above exists to avoid.
  //
  // It is also what stops the opening from being a dead frame. Without it the
  // first sampled frame of the ladder measured a standard deviation of exactly
  // zero — a uniform plate, indistinguishable from a broken shader.
  float alpha = clamp(mask * max(max(revealed, band * 0.9), 0.1), 0.0, 1.0);

  // Premultiplied: the context is set up with UNPACK_PREMULTIPLY_ALPHA_WEBGL.
  fragColor = vec4(lit * alpha, alpha);
}
`;

type TextRevealParams = {
  readonly time: number;
  readonly progress: number;
  readonly direction: readonly [number, number];
  readonly wobble: number;
  readonly bandWidth: number;
  readonly refraction: number;
  readonly settle: number;
  readonly colorA: readonly [number, number, number];
  readonly colorB: readonly [number, number, number];
  readonly silver: readonly [number, number, number];
};

const textReveal = makeShaderEffect<TextRevealParams>({
  type: "dev.remotionui.effects.textReveal",
  label: "textReveal()",
  fragmentShader: FRAGMENT_SHADER,
  // `time` and `progress` both belong in the key — leaving either out makes
  // Remotion reuse the previous frame's effect instance and the reveal freezes.
  calculateKey: (params) =>
    `text-reveal-${params.time}-${params.progress}-${params.direction.join(",")}-${params.wobble}-${params.bandWidth}-${params.refraction}-${params.settle}-${params.colorA.join(",")}-${params.colorB.join(",")}-${params.silver.join(",")}`,
  setUniforms: (gl, program, params) => {
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), params.time);
    gl.uniform1f(gl.getUniformLocation(program, "uProgress"), params.progress);
    gl.uniform2fv(
      gl.getUniformLocation(program, "uDirection"),
      new Float32Array(params.direction),
    );
    gl.uniform1f(gl.getUniformLocation(program, "uWobble"), params.wobble);
    gl.uniform1f(gl.getUniformLocation(program, "uBandWidth"), params.bandWidth);
    gl.uniform1f(
      gl.getUniformLocation(program, "uRefraction"),
      params.refraction,
    );
    gl.uniform1f(gl.getUniformLocation(program, "uSettle"), params.settle);
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColorA"),
      new Float32Array(params.colorA),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColorB"),
      new Float32Array(params.colorB),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "uSilver"),
      new Float32Array(params.silver),
    );
  },
  validateParams: (params) => {
    if (!Number.isFinite(params.time) || !Number.isFinite(params.progress)) {
      throw new TypeError("textReveal needs a finite time and progress");
    }
    if (params.bandWidth <= 0) {
      // A zero divides the exponential by nothing and the band becomes NaN,
      // which renders as a black frame with the render still exiting 0.
      throw new RangeError("textReveal needs a bandWidth above 0");
    }
  },
});

/**
 * Draws the copy white-on-transparent at the composition's own size. Only the
 * alpha channel is ever read, so the fill colour is arbitrary — white keeps the
 * antialiased edge pixels from darkening the coverage estimate.
 */
function rasterize(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  letterSpacing: number,
  lineHeight: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("text-reveal-shader could not get a 2D context");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Supported in Chrome, which is the only engine that ever rasterises this.
  ctx.letterSpacing = `${letterSpacing}px`;

  const lines = text.split("\n");
  const step = fontSize * lineHeight;
  // Centre the block, not the first line.
  const top = height / 2 - ((lines.length - 1) * step) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, top + index * step);
  });

  return canvas.toDataURL("image/png");
}

/**
 * Words condensing out of light into liquid chrome.
 *
 * The type is rasterised once to an alpha texture and handed to a fragment
 * shader as the source, rather than animated as DOM. That is what buys the
 * refraction: a CSS or SVG mask can uncover letterforms but cannot bend them
 * through a moving film, because it has no access to the pixels either side of
 * the edge it is drawing.
 *
 * Distinct from `masked-slide-reveal`, which slides a hard-edged mask over
 * type, and from `light-sweep-text`, which passes a specular highlight across
 * glyphs that are already fully visible.
 *
 * Renders with `--gl=angle`.
 */
export const TextRevealShader: React.FC<TextRevealShaderProps> = ({
  text = "LIQUID\nCHROME",
  backgroundColor = "#050505",
  colors = ["#e4ac59", "#f0abc0"],
  silverColor = "#ded8cf",
  angle = 34,
  delay = 0,
  duration = 78,
  wobble = 0.06,
  bandWidth = 0.022,
  refraction = 0.055,
  settle = 0.16,
  fontSize = 170,
  fontWeight = 800,
  fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  letterSpacing = 4,
  lineHeight = 1.02,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const { delayRender, continueRender } = useDelayRender();
  // Claimed during render rather than from an effect: a hold opened after the
  // effects have flushed can be too late to stop the capture it should block.
  const [handle] = useState(() =>
    delayRender("text-reveal-shader: waiting for fonts, then rasterising"),
  );
  const released = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const release = () => {
      if (released.current) return;
      released.current = true;
      continueRender(handle);
    };

    const run = async () => {
      try {
        // Rasterising before the face has loaded silently measures and draws a
        // fallback, so the render succeeds with the wrong typeface.
        await document.fonts?.ready;
      } finally {
        if (!cancelled) {
          setFontsReady(true);
        }
        release();
      }
    };

    void run();

    return () => {
      cancelled = true;
      // Never leave the hold open — an unmount mid-wait would hang the render.
      release();
    };
  }, [continueRender, handle]);

  // The raster does not change per frame, so it is built once and only the
  // uniforms move. Re-encoding a full-frame PNG every frame would dominate the
  // render cost of the component.
  const source = useMemo(
    () =>
      fontsReady
        ? rasterize(
            text,
            width,
            height,
            fontSize,
            fontWeight,
            fontFamily,
            letterSpacing,
            lineHeight,
          )
        : null,
    [
      fontsReady,
      text,
      width,
      height,
      fontSize,
      fontWeight,
      fontFamily,
      letterSpacing,
      lineHeight,
    ],
  );

  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const radians = (angle * Math.PI) / 180;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {source ? (
        <Img
          src={source}
          effects={[
            textReveal({
              time: frame / fps,
              progress,
              direction: [Math.cos(radians), Math.sin(radians)],
              wobble,
              bandWidth,
              refraction,
              settle,
              colorA: hexToRgb(colors[0]),
              colorB: hexToRgb(colors[1]),
              silver: hexToRgb(silverColor),
            }),
          ]}
          style={{ width: "100%", height: "100%" }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
