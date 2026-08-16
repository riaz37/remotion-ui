import {
  AbsoluteFill,
  interpolate,
  Solid,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { hexToRgb, makeShaderEffect } from "@/remotion/lib/gpu";
import { EASING } from "@/remotion/lib/motion-tokens";

export type MeshGradientBgProps = {
  backgroundColor?: string;
  /** Blob accent colors — solid hex, blended additively over the stage. */
  colors?: [string, string, string];
  intensity?: number;
};

const DEFAULT_COLORS: [string, string, string] = ["#e8b86d", "#2dd4bf", "#f472b6"];

type BlobConfig = {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  phase: number;
  period: number;
  /** Extra reach, in px at 1920 wide, standing in for the old CSS blur radius. */
  spread: number;
  alpha: number;
};

const BLOBS: BlobConfig[] = [
  { x: 20, y: 30, size: 60, driftX: 12, driftY: 9, phase: 0, period: 2.6, spread: 60, alpha: 0.55 },
  { x: 78, y: 22, size: 48, driftX: -10, driftY: 14, phase: 1.7, period: 3.3, spread: 46, alpha: 0.46 },
  { x: 58, y: 78, size: 54, driftX: 9, driftY: -12, phase: 3.4, period: 2.9, spread: 54, alpha: 0.5 },
];

/**
 * The CSS blobs faded to transparent at 70% of a farthest-corner circle, which
 * works out near 0.6 of the box, and the blur then pushed light past that. A
 * radius of `size / 2` reads as three separate dots instead of a mesh.
 */
const REACH = 0.6;

/**
 * The field each blob contributes is evaluated per pixel, so the falloff is
 * exact at any resolution. The CSS version approximated the same shape with a
 * radial-gradient div under a 60px blur, which banded on a dark stage and cost
 * three full-frame filter passes per frame.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform vec3 uColors[3];
// xy = centre in pixels, z = radius in pixels.
uniform vec3 uBlobs[3];
uniform float uAlphas[3];

void main() {
  vec4 base = texture(uSource, vUv);

  // vUv.y = 0 is the bottom of clip space, but the blob positions arrive as DOM
  // percentages measured from the top. Without this flip the layout renders
  // mirrored — which still looks like a plausible mesh, so it is easy to miss.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 px = uv * uResolution;

  vec3 accum = base.rgb;

  for (int i = 0; i < 3; i++) {
    vec3 blob = uBlobs[i];
    float d = distance(px, blob.xy) / max(blob.z, 1.0);

    // A single smoothstep, not a squared one: the CSS gradient ramped linearly
    // and the blur softened the ends, so squaring here collapses the mid-range
    // that makes the blobs read as one field rather than three dots.
    float falloff = 1.0 - smoothstep(0.0, 1.0, d);

    vec3 contribution = uColors[i] * falloff * uAlphas[i];

    // Screen, matching the CSS mixBlendMode the blobs used, so bright overlaps
    // roll off toward white instead of clipping.
    accum = 1.0 - (1.0 - accum) * (1.0 - contribution);
  }

  // Floor vignette — the stage sits on something, and the darker base edge
  // keeps foreground text legible over a blob that drifts low.
  vec2 toFloor = (uv - vec2(0.5, 1.15)) * vec2(uResolution.x / uResolution.y, 1.0);
  accum *= 1.0 - (1.0 - smoothstep(0.0, 0.6, length(toFloor))) * 0.5;

  fragColor = vec4(accum, 1.0);
}
`;

type MeshBlobsParams = {
  /** Per blob: centre x, centre y and radius, all in pixels. */
  readonly blobs: readonly (readonly [number, number, number])[];
  /** Per blob: RGB in 0..1. */
  readonly colors: readonly (readonly [number, number, number])[];
  readonly alphas: readonly number[];
};

const meshBlobs = makeShaderEffect<MeshBlobsParams>({
  type: "dev.remotionui.effects.meshBlobs",
  label: "meshBlobs()",
  fragmentShader: FRAGMENT_SHADER,
  calculateKey: (params) =>
    `mesh-blobs-${params.blobs.flat().join(",")}-${params.colors.flat().join(",")}-${params.alphas.join(",")}`,
  setUniforms: (gl, program, params) => {
    gl.uniform3fv(
      gl.getUniformLocation(program, "uBlobs"),
      new Float32Array(params.blobs.flat()),
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "uColors"),
      new Float32Array(params.colors.flat()),
    );
    gl.uniform1fv(
      gl.getUniformLocation(program, "uAlphas"),
      new Float32Array(params.alphas),
    );
  },
  validateParams: (params) => {
    if (params.blobs.length !== 3 || params.colors.length !== 3) {
      throw new TypeError("meshBlobs expects exactly three blobs and colors");
    }
  },
});

export const MeshGradientBg: React.FC<MeshGradientBgProps> = ({
  backgroundColor = "#080810",
  colors = DEFAULT_COLORS,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;

  // Continuous breathing scale — driven by a sine so it loops with no seam,
  // unlike a clamped ramp that would freeze once it reached its endpoint.
  const breathe = interpolate(Math.sin(time / 5.5), [-1, 1], [0, 1], {
    easing: EASING.editorial,
  });

  // The drift is the same motion the CSS version used; only the compositing
  // moved to the GPU, so an existing render keeps its timing.
  const blobs = BLOBS.map((blob) => {
    const wave = Math.sin(time / blob.period + blob.phase);
    const waveY = Math.cos(time / (blob.period * 1.3) + blob.phase * 0.7);
    const scale = 0.94 + breathe * 0.1 + wave * 0.05;

    return [
      ((blob.x + wave * blob.driftX * intensity) / 100) * width,
      ((blob.y + waveY * blob.driftY * intensity) / 100) * height,
      (blob.size / 100) * width * scale * REACH + (blob.spread * width) / 1920,
    ] as const;
  });

  const alphas = BLOBS.map(
    (blob) => blob.alpha * (0.85 + Math.sin(time / blob.period + blob.phase) * 0.15),
  );

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <Solid
        width={width}
        height={height}
        color={backgroundColor}
        effects={[
          meshBlobs({
            blobs,
            colors: colors.map(hexToRgb),
            alphas,
          }),
        ]}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
