import { AbsoluteFill, Solid, useCurrentFrame, useVideoConfig } from "remotion";
import { hexToRgb, makeShaderEffect } from "@/remotion/lib/gpu";

export type LightTunnelBgProps = {
  /** Plate behind the tunnel, and the colour the far centre falls off to. */
  backgroundColor?: string;
  /** Three ribbon tints, distributed around the barrel by ribbon index. */
  colors?: [string, string, string];
  /**
   * How many ribbons run down the barrel. Rounded to an integer on purpose:
   * a fractional count leaves a visible seam where the angle wraps.
   */
  ribbons?: number;
  /** How hard the barrel twists with depth. 0 gives straight ribbons. */
  twist?: number;
  /** Rings per unit of log-depth. Higher packs the folds tighter. */
  ringDensity?: number;
  /** Radius of the centre defocus, in frame heights. 0 leaves it sharp. */
  defocus?: number;
  /** Overall brightness. */
  intensity?: number;
  /** Flight speed down the barrel. 0 freezes the tunnel. */
  speed?: number;
};

/**
 * A flat field remapped onto the inside of a cylinder.
 *
 * The mapping is the whole component: depth comes from the reciprocal radius,
 * so the wall rushes past as the pixel approaches the centre, and the angle
 * comes from `atan` plus a twist that is coupled to that depth. The angular
 * repeat count is an integer because the twist is added *before* the wrap —
 * a fractional count puts a hard seam down the line where `atan` flips sign.
 *
 * Two details carry the look:
 *
 * - **Log-spaced rings.** Rings placed evenly in `r` bunch into a solid mass
 *   near the centre and vanish at the rim. Placed evenly in `log(r)` they stay
 *   the same apparent width all the way in, which is what keeps the folds
 *   readable rather than turning into a bright smear.
 * - **A defocused centre, not a clamped one.** `1/r` is singular at the middle
 *   of the frame. Clamping the radius is the usual fix and it is also the usual
 *   tell: it leaves a flat disc with a hard rim sitting in the vanishing point.
 *   Averaging a Gaussian disk of taps whose radius grows as `r` falls instead
 *   resolves the singularity the way a lens does, by losing focus.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSource;
uniform vec2 uResolution;
/** Seconds of composition time, already multiplied by speed. */
uniform float uTime;
/** Integer angular repeats. Held as a float only because uniforms are cheaper that way. */
uniform float uRibbons;
uniform float uTwist;
uniform float uRingDensity;
uniform float uDefocus;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

const float TAU = 6.28318530718;

/**
 * A 9-tap Gaussian disk. Nine is the point where the centre of the frame stops
 * showing tap structure as faint rosettes at the defocus radii we use here.
 */
const vec2 TAPS[9] = vec2[9](
  vec2(0.0, 0.0),
  vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0),
  vec2(0.7071, 0.7071), vec2(-0.7071, 0.7071),
  vec2(0.7071, -0.7071), vec2(-0.7071, -0.7071)
);
const float WEIGHTS[9] = float[9](
  0.25,
  0.115, 0.115, 0.115, 0.115,
  0.0725, 0.0725, 0.0725, 0.0725
);

/** The tunnel wall at one point of the centred, aspect-corrected plane. */
vec3 material(vec2 p) {
  float r = max(length(p), 1e-4);
  float a = atan(p.y, p.x);

  // Depth from the reciprocal radius. Travel is added, not multiplied, so the
  // flight reads as constant speed down a fixed barrel.
  float z = 1.0 / r + uTime;

  // The twist is depth-coupled, so the ribbons corkscrew as they recede.
  // Wrapping by an integer repeat count after the twist is what keeps the
  // angular seam at a = +/-PI invisible.
  float turn = (a + z * uTwist) / TAU;
  float ribbonPos = turn * uRibbons;
  float ribbonId = floor(ribbonPos);
  float ribbon = fract(ribbonPos);

  // Rings even in log(r): evenly spaced in r they pile up at the centre. The
  // flight is added inside the log so the rings stream outward at the same
  // rate the ribbons corkscrew past, instead of on a clock of their own.
  float rings = fract((-log(r) + uTime) * uRingDensity);

  // Tight on the leading side and soft on the trailing one, so a fold reads as
  // an edge catching light with a falloff behind it. Symmetric smoothsteps as
  // wide as these were made every ribbon a soft blob and the barrel lost its
  // structure entirely.
  float fold = smoothstep(0.0, 0.18, ribbon) * (1.0 - smoothstep(0.62, 1.0, ribbon));
  float band = smoothstep(0.0, 0.12, rings) * (1.0 - smoothstep(0.45, 0.9, rings));

  // Hue is keyed to the ribbon index, which is a property of the ribbon rather
  // than of the clock, so a ribbon keeps its colour for the whole flight
  // instead of the barrel cycling through the palette as depth advances.
  //
  // Dividing by the repeat count is load-bearing. At the atan seam the index
  // jumps by exactly uRibbons, so this ratio jumps by exactly 1 and fract()
  // stays continuous. Keyed to any other multiple — an arbitrary 0.137, say —
  // the geometry still wraps cleanly but the *colour* does not, and a hard
  // seam appears along the line where the angle flips sign.
  float hue = fract(ribbonId / uRibbons);
  vec3 tint = mix(
    mix(uColorA, uColorB, smoothstep(0.0, 0.5, hue)),
    uColorC,
    smoothstep(0.5, 1.0, hue)
  );

  // Distance is darkness: the far end of the barrel falls off to the plate.
  float reach = smoothstep(0.0, 0.55, r);

  // Weighted hard toward the folds: a high floor here washes the gaps between
  // ribbons up to the same brightness as the ribbons and the depth cue dies.
  return tint * (0.08 + 0.92 * fold) * (0.16 + 0.84 * band) * reach * uIntensity;
}

void main() {
  vec4 base = texture(uSource, vUv);

  // vUv.y = 0 is the bottom of clip space. The tunnel is radially symmetric
  // about the centre, so a missed flip here would not show — the flip is kept
  // anyway so the maths matches every other primitive in the lane.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

  float r = length(p);

  // Defocus grows as the wall recedes, so the singularity at r = 0 is resolved
  // by losing focus rather than by clamping the radius.
  float blur = uDefocus * (1.0 - smoothstep(0.0, 0.4, r));

  vec3 accum = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    accum += material(p + TAPS[i] * blur) * WEIGHTS[i];
  }

  // Screened over the plate so bright folds roll off toward white rather than
  // clipping, matching how the rest of the lane composites.
  vec3 color = 1.0 - (1.0 - base.rgb) * (1.0 - accum);

  fragColor = vec4(color, 1.0);
}
`;

type LightTunnelParams = {
  readonly time: number;
  readonly ribbons: number;
  readonly twist: number;
  readonly ringDensity: number;
  readonly defocus: number;
  readonly intensity: number;
  readonly colors: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
};

const lightTunnel = makeShaderEffect<LightTunnelParams>({
  type: "dev.remotionui.effects.lightTunnel",
  label: "lightTunnel()",
  fragmentShader: FRAGMENT_SHADER,
  // `time` has to be in the key: without it Remotion treats every frame as the
  // same effect instance and the tunnel renders frozen.
  calculateKey: (params) =>
    `light-tunnel-${params.time}-${params.ribbons}-${params.twist}-${params.ringDensity}-${params.defocus}-${params.intensity}-${params.colors.flat().join(",")}`,
  setUniforms: (gl, program, params) => {
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), params.time);
    gl.uniform1f(gl.getUniformLocation(program, "uRibbons"), params.ribbons);
    gl.uniform1f(gl.getUniformLocation(program, "uTwist"), params.twist);
    gl.uniform1f(
      gl.getUniformLocation(program, "uRingDensity"),
      params.ringDensity,
    );
    gl.uniform1f(gl.getUniformLocation(program, "uDefocus"), params.defocus);
    gl.uniform1f(gl.getUniformLocation(program, "uIntensity"), params.intensity);
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColorA"),
      new Float32Array(params.colors[0]),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColorB"),
      new Float32Array(params.colors[1]),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColorC"),
      new Float32Array(params.colors[2]),
    );
  },
  validateParams: (params) => {
    if (!Number.isFinite(params.time)) {
      // An undefined prop spread into the params reaches the shader as NaN and
      // renders a black frame with the render still exiting 0.
      throw new TypeError("lightTunnel needs a finite time");
    }
    if (params.ribbons < 1 || params.ribbons !== Math.round(params.ribbons)) {
      throw new RangeError("lightTunnel needs an integer ribbon count above 0");
    }
  },
});

const DEFAULT_COLORS: [string, string, string] = [
  "#e4ac59",
  "#e07a5f",
  "#c2557a",
];

/**
 * Flight down a twisting barrel of light.
 *
 * Distinct from the other fields in the lane: `mesh-gradient-bg` drifts blobs
 * across a flat plane and `warp-bands-bg` folds bands in place, while this one
 * has a vanishing point and travels toward it, so it carries depth that the
 * others cannot.
 *
 * Renders with `--gl=angle`.
 */
export const LightTunnelBg: React.FC<LightTunnelBgProps> = ({
  backgroundColor = "#050505",
  colors = DEFAULT_COLORS,
  ribbons = 12,
  twist = 0.22,
  ringDensity = 3.2,
  defocus = 0.035,
  intensity = 1,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Every prop is defaulted before it reaches the effect: an explicit
  // `undefined` from a caller would otherwise arrive at the shader as NaN.
  const time = (frame / fps) * speed;
  const safeRibbons = Math.max(1, Math.round(ribbons));

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <Solid
        width={width}
        height={height}
        color={backgroundColor}
        effects={[
          lightTunnel({
            time,
            ribbons: safeRibbons,
            twist,
            ringDensity,
            defocus,
            intensity,
            colors: [
              hexToRgb(colors[0]),
              hexToRgb(colors[1]),
              hexToRgb(colors[2]),
            ],
          }),
        ]}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
