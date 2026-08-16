import {
  AbsoluteFill,
  createEffect,
  interpolate,
  Solid,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
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

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUv;
out vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

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

const QUAD = new Float32Array([
  -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
]);

type MeshBlobsParams = {
  /** Per blob: centre x, centre y and radius, all in pixels. */
  readonly blobs: readonly (readonly [number, number, number])[];
  /** Per blob: linear RGB in 0..1. */
  readonly colors: readonly (readonly [number, number, number])[];
  readonly alphas: readonly number[];
};

type MeshBlobsState = {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vbo: WebGLBuffer;
  readonly texture: WebGLTexture;
};

const compile = (
  gl: WebGL2RenderingContext,
  source: string,
  type: number,
): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Could not create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Without this the shader fails silently and the background renders black.
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};

const meshBlobs = createEffect<MeshBlobsParams, MeshBlobsState>({
  type: "dev.remotionui.effects.meshBlobs",
  label: "meshBlobs()",
  documentationLink: null,
  backend: "webgl2",
  calculateKey: (params) =>
    `mesh-blobs-${params.blobs.flat().join(",")}-${params.colors.flat().join(",")}-${params.alphas.join(",")}`,
  setup: (target) => {
    const gl = target.getContext("webgl2", {
      premultipliedAlpha: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      throw new Error("WebGL2 unavailable for MeshGradientBg");
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    const program = gl.createProgram();
    if (!program) {
      throw new Error("Could not create program");
    }

    const vertex = compile(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragment = compile(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    const texture = gl.createTexture();
    if (!vao || !vbo || !texture) {
      throw new Error("Could not create WebGL resources");
    }

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { gl, program, vao, vbo, texture };
  },
  apply: ({ state, source, width, height, params, flipSourceY }) => {
    const { gl, program, vao, texture } = state;

    gl.viewport(0, 0, width, height);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipSourceY);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // `source` is typed as CanvasImageSource, whose SVGImageElement member
    // texImage2D does not accept. Remotion only ever hands over a canvas.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source as TexImageSource,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uSource"), 0);
    gl.uniform2f(gl.getUniformLocation(program, "uResolution"), width, height);
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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
  },
  cleanup: ({ gl, program, vao, vbo, texture }) => {
    gl.deleteTexture(texture);
    gl.deleteBuffer(vbo);
    gl.deleteProgram(program);
    gl.deleteVertexArray(vao);
  },
  schema: {},
  validateParams: (params) => {
    if (params.blobs.length !== 3 || params.colors.length !== 3) {
      throw new TypeError("meshBlobs expects exactly three blobs and colors");
    }
  },
});

/** `#rgb` or `#rrggbb` to 0..1 components. Unparseable input falls back to black. */
const parseHex = (hex: string): [number, number, number] => {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return [0, 0, 0];
  }

  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
};

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
            colors: colors.map(parseHex),
            alphas,
          }),
        ]}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
