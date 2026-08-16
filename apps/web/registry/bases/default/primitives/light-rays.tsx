import { AbsoluteFill, Solid, useCurrentFrame, useVideoConfig } from "remotion";
import { hexToRgb, makeShaderEffect } from "@/remotion/lib/gpu";

export type LightRaysProps = {
  /** Plate behind the rays. `transparent` layers them over whatever is below. */
  backgroundColor?: string;
  /** Colour of the shafts. */
  color?: string;
  /** How many shafts. Odd counts avoid a symmetric seam down the middle. */
  rayCount?: number;
  /** Total fan angle, in degrees. */
  spread?: number;
  /** Direction the fan points, in degrees. 0 points straight down. */
  angle?: number;
  /** Where the light comes from, in percent of the frame. */
  originX?: number;
  originY?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Sway speed. 1 is a slow drift; 0 freezes the fan. */
  speed?: number;
  /** Softness of a shaft's edge, in px. */
  blur?: number;
  /** Bloom radius at the source, in percent. 0 removes the bloom. */
  bloom?: number;
};

type Ray = {
  /** Position across the fan, -0.5 to 0.5. */
  offset: number;
  width: number;
  alpha: number;
  period: number;
  phase: number;
  sway: number;
};

/** Sized to the uniform array below; a fan past this reads as a solid wash anyway. */
const MAX_RAYS = 32;

/**
 * Deterministic 0–1 per ray. The fan has to be identical on every frame of a
 * render, so the variation is hashed from the index, never sampled.
 */
function hash(index: number, salt: number): number {
  const value = Math.sin(index * 41.13 + salt * 289.7) * 43758.5453;
  return value - Math.floor(value);
}

function buildRays(count: number): Ray[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    return {
      offset: t - 0.5,
      // Uneven widths are what stop a fan reading as a printed sunburst.
      width: 1.6 + hash(index, 1) * 5.4,
      alpha: 0.24 + hash(index, 2) * 0.76,
      /* Sway periods are short and the arcs are wide on purpose. An 18px blur
       * swallows anything under a couple of degrees: the first cut swayed 1-2°
       * over six seconds and measured as a still frame on the audit. */
      period: 1.6 + hash(index, 3) * 2.4,
      phase: hash(index, 4) * Math.PI * 2,
      sway: 2.6 + hash(index, 5) * 5.4,
    };
  });
}

/**
 * The wedge the CSS drew with `clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%)`
 * — 8% of the shaft's width either side of the axis at the source, opening to
 * the full half-width at the far end.
 */
const HALF_AT_SOURCE = 0.08;
const HALF_GAIN = 0.42;
/** The `linear-gradient(to bottom, color 0%, transparent 92%)` down each shaft. */
const LENGTH_FADE = 0.92;
/** `height: 190%` on every shaft. */
const SHAFT_LENGTH = 1.9;

/**
 * Each shaft is evaluated as a field rather than drawn and blurred.
 *
 * The CSS version stacked one blurred, clipped div per shaft — eleven
 * full-frame filter passes a frame, and the blur radius set the softness in
 * screen pixels, so the same props softened differently at 1080p and 4K. Here
 * the edge is a `smoothstep` across the wedge boundary, which is what the blur
 * was approximating in the first place.
 *
 * This is the distinction that made the primitive worth porting where
 * `caustics-bg` was not: there the blur *formed* the structure by joining
 * separate wave crests into ridges, so removing it left ragged patches. Here it
 * only softens an edge the wedge geometry already defines.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform vec3 uColor;
/** Source of the fan, in pixels from the top-left. */
uniform vec2 uOrigin;
/** x = radius in pixels, y = peak alpha. Radius 0 disables the bloom. */
uniform vec2 uBloom;
/** Edge softness in pixels — what the CSS blur radius used to buy. */
uniform float uBlur;
/** Shaft length in pixels. */
uniform float uLength;
uniform int uRayCount;
/** Per shaft: x = rotation in radians, y = full width in pixels, z = alpha. */
uniform vec3 uRays[${MAX_RAYS}];

void main() {
  vec4 base = texture(uSource, vUv);

  // vUv.y = 0 is the bottom of clip space, but the origin arrives as a DOM
  // percentage measured from the top. Without this flip the fan renders
  // mirrored — which still looks like plausible light, so it is easy to miss.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 px = uv * uResolution;
  vec2 d = px - uOrigin;

  vec3 accum = base.rgb;
  float alpha = base.a;

  if (uBloom.x > 0.0) {
    // Linear, not a smoothstep: the CSS gradient ramped straight from the
    // colour to transparent, and a smoothstep holds the core near full for
    // most of the radius, which at this size swamps the shafts it is meant to
    // sit behind.
    float bloom = (1.0 - clamp(length(d) / uBloom.x, 0.0, 1.0)) * uBloom.y;
    accum = 1.0 - (1.0 - accum) * (1.0 - uColor * bloom);
    alpha += bloom * (1.0 - alpha);
  }

  for (int i = 0; i < ${MAX_RAYS}; i++) {
    if (i >= uRayCount) {
      break;
    }

    float theta = uRays[i].x;
    float width = uRays[i].y;

    // CSS rotate() turns the shaft about its top edge in screen space, where y
    // runs downward: rotate(t) sends the +x axis to (cos t, sin t) and the
    // downward axis to (-sin t, cos t).
    vec2 down = vec2(-sin(theta), cos(theta));
    vec2 side = vec2(cos(theta), sin(theta));

    float along = dot(d, down);
    float across = dot(d, side);
    float t = along / uLength;

    // The wedge widens with distance, which is the difference between a shaft
    // of light and a drawn line.
    float halfWidth = width * (${HALF_AT_SOURCE} + ${HALF_GAIN} * t);

    // 'half' is a reserved word in GLSL ES — naming this 'half' compiles to a
    // black frame with the render still exiting 0.
    float cover = 1.0 - smoothstep(halfWidth - uBlur, halfWidth + uBlur, abs(across));
    float fade = clamp(1.0 - t / ${LENGTH_FADE}, 0.0, 1.0);
    // Soften both ends the way the blur did, so a shaft does not begin or end
    // on a hard line.
    float ends =
      smoothstep(0.0, uBlur, along) *
      (1.0 - smoothstep(uLength - uBlur, uLength, along));

    float amount = cover * fade * ends * uRays[i].z;
    if (amount <= 0.0) {
      continue;
    }

    // Screen, matching the CSS mixBlendMode: overlapping shafts add the way
    // light does instead of stacking alpha and going muddy.
    accum = 1.0 - (1.0 - accum) * (1.0 - uColor * amount);
    alpha += amount * (1.0 - alpha);
  }

  // Floor vignette — a black plate at 45%, fading out by 62% of a
  // farthest-corner circle centred below the frame.
  vec2 toFloor = px - vec2(uResolution.x * 0.5, uResolution.y * 1.2);
  float reach =
    0.62 * length(vec2(uResolution.x * 0.5, uResolution.y * 1.2));
  float vignette = 0.45 * (1.0 - clamp(length(toFloor) / reach, 0.0, 1.0));
  accum *= 1.0 - vignette;
  alpha += vignette * (1.0 - alpha);

  fragColor = vec4(accum, alpha);
}
`;

type LightShaftsParams = {
  /** Per shaft: rotation in radians, full width in pixels, alpha. */
  readonly rays: readonly (readonly [number, number, number])[];
  /** RGB in 0..1. */
  readonly color: readonly [number, number, number];
  /** Fan source in pixels. */
  readonly origin: readonly [number, number];
  /** Bloom radius in pixels and its peak alpha. */
  readonly bloom: readonly [number, number];
  readonly blur: number;
  readonly length: number;
};

const lightShafts = makeShaderEffect<LightShaftsParams>({
  type: "dev.remotionui.effects.lightShafts",
  label: "lightShafts()",
  fragmentShader: FRAGMENT_SHADER,
  calculateKey: (params) =>
    `light-shafts-${params.rays.flat().join(",")}-${params.color.join(",")}-${params.origin.join(",")}-${params.bloom.join(",")}-${params.blur}-${params.length}`,
  setUniforms: (gl, program, params) => {
    // Padded to the declared array length: WebGL rejects a short uniform array
    // upload, and the loop stops at uRayCount regardless.
    const rays = new Float32Array(MAX_RAYS * 3);
    rays.set(params.rays.flat());

    gl.uniform3fv(gl.getUniformLocation(program, "uRays"), rays);
    gl.uniform1i(gl.getUniformLocation(program, "uRayCount"), params.rays.length);
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColor"),
      new Float32Array(params.color),
    );
    gl.uniform2fv(
      gl.getUniformLocation(program, "uOrigin"),
      new Float32Array(params.origin),
    );
    gl.uniform2fv(
      gl.getUniformLocation(program, "uBloom"),
      new Float32Array(params.bloom),
    );
    gl.uniform1f(gl.getUniformLocation(program, "uBlur"), params.blur);
    gl.uniform1f(gl.getUniformLocation(program, "uLength"), params.length);
  },
  validateParams: (params) => {
    if (params.rays.length > MAX_RAYS) {
      throw new RangeError(`lightShafts supports at most ${MAX_RAYS} rays`);
    }
    if (params.blur <= 0) {
      // A zero here divides the smoothstep by nothing and the shaft edges alias.
      throw new RangeError("lightShafts needs a blur above 0");
    }
  },
});

/**
 * Volumetric shafts fanning out of a point and drifting.
 *
 * A full-frame background, unlike `light-sweep-text`, which is a specular pass
 * clipped to letterforms — and shafts rather than blobs, which is
 * `mesh-gradient-bg`'s job.
 *
 * Width, brightness and sway period are all hashed per index: an evenly spaced,
 * evenly bright fan reads as a printed sunburst rather than as light in air.
 * The motion is unchanged from the CSS version — only the compositing moved to
 * the GPU, so an existing render keeps its timing.
 */
export const LightRays: React.FC<LightRaysProps> = ({
  backgroundColor = "#080810",
  color = "#e8b86d",
  rayCount = 11,
  spread = 52,
  angle = 22,
  originX = 26,
  originY = -12,
  intensity = 1,
  speed = 1,
  blur = 13,
  bloom = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = (frame / fps) * speed;

  const rays = buildRays(
    Math.min(MAX_RAYS, Math.max(1, Math.round(rayCount))),
  );
  // The whole fan breathes as one, on a longer clock than any single shaft.
  const fanDrift = Math.sin(time * 0.52) * 5.5;

  const shafts = rays.map((ray) => {
    const sway = Math.sin(time / ray.period + ray.phase) * ray.sway;
    const rotation = angle + fanDrift + ray.offset * spread + sway;
    // Shafts pulse out of phase with their own sway, so nothing in the fan
    // shares a beat.
    const flicker = 0.45 + 0.55 * Math.sin(time / (ray.period * 0.6) + ray.phase * 1.7);

    return [
      (rotation * Math.PI) / 180,
      (ray.width / 100) * width,
      ray.alpha * flicker * 0.46 * intensity,
    ] as const;
  });

  /**
   * The CSS bloom was a square box `bloom * 2` percent wide holding a circular
   * gradient that reached its farthest corner, cut to transparent at 68%, then
   * blurred. That works out as the radius below.
   */
  const bloomRadius =
    bloom > 0 ? 0.68 * Math.SQRT1_2 * (bloom / 50) * width + blur * 2 : 0;

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <Solid
        width={width}
        height={height}
        color={backgroundColor}
        effects={[
          lightShafts({
            rays: shafts,
            color: hexToRgb(color),
            origin: [(originX / 100) * width, (originY / 100) * height],
            bloom: [
              bloomRadius,
              0.3 * intensity * (0.86 + 0.14 * Math.sin(time * 0.7)),
            ],
            blur,
            length: SHAFT_LENGTH * height,
          }),
        ]}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
