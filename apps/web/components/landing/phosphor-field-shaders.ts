/**
 * GLSL for the hero's phosphor field. Two passes:
 *
 * 1. FIELD draws light only ("ink"), with no page background: amber streaks
 *    fanning up from a source below the copy, where the monitor rises from.
 *    `uProgress` is the hero's scroll progress. As the monitor opens, the fan
 *    narrows onto it and the whole field dims, like house lights going down.
 * 2. SCREEN re-prints that ink as a rotated halftone and composites it onto
 *    the page background for the current theme. Additive on dark, subtractive
 *    on light, so the same field reads as light in both.
 */

export const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const FIELD_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
out vec4 outColor;

const float DEG = 0.01745329252;

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

void main() {
  vec2 pos = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float p = uProgress;
  float t = uTime;

  // The source sits under the copy and sinks into the monitor as it opens.
  // On a portrait screen the stage is only ~0.5 tall either side of centre, so
  // the source rises into frame instead of lighting only the bottom corners.
  float portrait = smoothstep(1.0, 0.6, uResolution.x / uResolution.y);
  vec2 source = vec2(0.0, -0.66 + portrait * 0.28 - p * 0.3);
  vec2 d = pos - source;
  float r = length(d);
  float angle = atan(d.x, d.y);

  // Fan of light that narrows onto the monitor with scroll.
  float spread = mix(1.2, 0.55, smoothstep(0.0, 0.7, p));
  float fan = smoothstep(spread, spread * 0.3, abs(angle));
  // Two lobes: the column straight above the source, where the copy is, stays dim.
  float lobes = mix(0.3, 1.0, smoothstep(0.06, 0.5, abs(angle)));

  float warp = fbm(vec2(angle * 3.2, r * 0.7 - t * 0.07));
  // Low angular frequency keeps the beams broad and soft rather than wiry.
  float streak = fbm(vec2(angle * 6.5 + warp * 1.6, t * 0.045 + r * 0.15));
  streak = pow(smoothstep(0.26, 0.8, streak), 1.8);

  float body = exp(-r * 0.78);
  float haze = exp(-r * 1.6) * 0.38;
  float breath = 0.92 + 0.08 * sin(t * 0.35);
  float intensity = (streak * 1.7 * body + haze) * fan * lobes * breath;

  // House lights down.
  intensity *= mix(1.0, 0.16, smoothstep(0.02, 0.55, p));

  // Amber core, gold toward the tips, a trace of tally red at the outer edges.
  float k = clamp(r * 0.65 + (warp - 0.5) * 0.7, 0.0, 1.0);
  // Capped at 80deg: past that, high-lightness amber drifts into olive.
  float hue = mix(52.0, 80.0, k);
  hue = mix(hue, 30.0, smoothstep(0.6, 1.2, abs(angle)) * 0.55);
  vec3 tint = clamp(oklchToLinear(0.84 - 0.1 * k, 0.14, hue * DEG), 0.0, 1.0);

  vec3 x = tint * intensity * 1.85;
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  outColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
}
`;

export const SCREEN_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uTheme;
uniform vec3 uPageDark;
uniform vec3 uPagePaper;
out vec4 outColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float ANGLE = 0.52;

/** The 2x2 ordered matrix [[0,2],[3,1]], as a closed form. */
float ordered2(vec2 q) {
  return mod(2.0 * q.x + 3.0 * q.y, 4.0);
}

/**
 * 4x4 Bayer threshold in 0..1, built by the usual recursion: the coarse 2x2
 * picks the quadrant, the fine 2x2 orders within it. One LSB of this breaks
 * the banding a smooth gradient shows on an 8-bit canvas, and unlike a noise
 * dither it is fixed to the pixel grid, so it cannot shimmer between frames.
 */
float bayer4(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  return (4.0 * ordered2(floor(q * 0.5)) + ordered2(mod(q, 2.0))) / 16.0;
}

void main() {
  vec2 frag = gl_FragCoord.xy;

  // Dot pitch in CSS pixels, coarsening as the lights go down, floored so it
  // never drops under a device pixel and aliases.
  float cell = max(3.0, 4.8 * (1.0 + uProgress * 0.5) * uPixelRatio);

  // The screen is a lattice, not a grid of squares: two cell-length basis
  // vectors turned off-axis. Walking the basis gives the nearest node back in
  // pixels directly, so nothing has to be rotated out of screen space again.
  vec2 e0 = cell * vec2(cos(ANGLE), sin(ANGLE));
  vec2 e1 = vec2(-e0.y, e0.x);
  vec2 lattice = vec2(dot(frag, e0), dot(frag, e1)) / (cell * cell);
  vec2 node = floor(lattice) + 0.5;
  vec2 centre = node.x * e0 + node.y * e1;

  vec3 soft = texture(uField, frag / uResolution).rgb;
  vec3 cellInk = texture(uField, clamp(centre / uResolution, 0.0, 1.0)).rgb;
  float tone = clamp(dot(cellInk, LUMA), 0.0, 1.0);

  // A screen is a threshold against a spot function, not a circle of measured
  // area: ink lands wherever the cone standing on the node rises above the
  // tone that cell owes. The spot falls one unit per reach pixels, so 1/reach
  // is a one-pixel feather.
  float reach = cell * 0.62;
  float spot = 1.0 - length(frag - centre) / reach;
  float aa = 1.0 / reach;
  float inked = smoothstep(-aa, aa, spot - (1.0 - tone));

  // The screen modulates the light already there rather than reprinting it as
  // fresh ink, so exposure is held by dividing out the mask's own mean: the
  // spot covers pi*0.62^2*tone^2 of its cell, and whatever the screen has not
  // bitten into stays at full soft light. Dim cells keep that soft light - a
  // screen only asserts itself once it carries some tone.
  float bite = 0.62 * smoothstep(0.0, 0.14, tone);
  float coverage = clamp(1.207 * tone * tone, 0.0, 1.0);
  float gain = 1.0 / max(1.0 - bite + bite * coverage, 1e-3);
  vec3 ink = clamp(soft * mix(1.0, inked, bite) * gain, 0.0, 1.0);

  // On a dark page the light adds, the photographic screen op. On paper there
  // is nothing to add to, so the same ink is spent as shade: a multiply, with
  // a trace of its own hue left in so the shadow stays warm rather than grey.
  vec3 onDark = 1.0 - (1.0 - uPageDark) * (1.0 - ink);
  float density = clamp(dot(ink, LUMA) * 1.35, 0.0, 1.0);
  vec3 onPaper = uPagePaper * (1.0 - density * 0.55) + ink * 0.18;
  vec3 color = mix(onDark, onPaper, uTheme);

  color += (bayer4(frag) - 0.5) / 255.0;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
