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

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
out vec4 outColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float ANGLE = 0.52;

float grain(vec2 p, float frame) {
  p += 5.588238 * mod(frame, 64.0);
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  // Dots coarsen slightly as the lights go down.
  float cell = max(3.0, 4.8 * uPixelRatio * (1.0 + uProgress * 0.5));
  mat2 turn = mat2(cos(ANGLE), -sin(ANGLE), sin(ANGLE), cos(ANGLE));
  vec2 rotated = turn * frag;
  vec2 centre = (floor(rotated / cell) + 0.5) * cell;
  vec2 samplePx = transpose(turn) * centre;

  vec3 soft = texture(uScene, frag / uResolution).rgb;
  vec3 cellInk = texture(uScene, clamp(samplePx / uResolution, 0.0, 1.0)).rgb;
  float level = clamp(dot(cellInk, LUMA), 0.0, 1.0);

  float radius = cell * sqrt(level / 3.14159265);
  float aa = 0.7 * uPixelRatio;
  float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, length(rotated - centre));
  vec3 dots = cellInk * min(0.8 / max(level, 1e-3), 2.4) * dotMask;
  float presence = smoothstep(0.02, 0.15, level) * 0.62;
  vec3 ink = clamp(mix(soft, dots, presence), 0.0, 1.0);

  vec3 dark = uDarkBackground + ink * (1.0 - uDarkBackground);
  float strength = max(ink.r, max(ink.g, ink.b));
  vec3 light = uLightBackground * (1.0 - strength * 0.88) + ink * 0.8;
  vec3 color = mix(dark, light, uLightMode);

  color += (grain(frag, floor(uTime * 24.0)) - 0.5) / 255.0;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
