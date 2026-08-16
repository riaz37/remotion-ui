import type { HtmlInCanvasShader } from "@remotion/transitions";
import { makeHtmlInCanvasPresentation } from "@remotion/transitions";

export type GrainDissolveProps = {
  /** Size of a noise cell in pixels. Larger reads as coarser dither. */
  grain?: number;
  /** Width of the dissolve edge, 0 (hard threshold) to 1 (soft crossfade). */
  softness?: number;
  /** Colour the burn edge picks up as a scene breaks apart. */
  edgeColor?: [number, number, number];
  /** 0 = pure noise (static), 1 = a clean diagonal ramp with no grain. */
  sweep?: number;
};

const VERTEX_SHADER = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/**
 * A per-cell noise field decides the order pixels flip from prev to next.
 * `u_time` is 1 at the start of the transition and 0 at the end, matching
 * Remotion's convention, so the threshold walks the same direction as time.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_prev;
uniform sampler2D u_next;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_grain;
uniform float u_softness;
uniform float u_sweep;
uniform vec3 u_edge;

in vec2 v_uv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec4 prev = texture(u_prev, v_uv);
  vec4 next = texture(u_next, v_uv);

  vec2 cell = floor(v_uv * u_resolution / max(u_grain, 1.0));

  // Pure per-cell noise makes every cell flip independently, which reads as TV
  // static. Blending the noise toward a diagonal ramp makes the dissolve travel
  // across the frame while still breaking up along a grain edge.
  float sweep = (v_uv.x + v_uv.y) * 0.5;
  float threshold = mix(hash(cell), sweep, u_sweep);

  // progress runs 0 -> 1 as the transition advances.
  float progress = 1.0 - u_time;
  float soft = max(u_softness, 0.001);
  float mask = smoothstep(threshold - soft, threshold + soft, progress);

  vec4 base = mix(prev, next, mask);

  // Cells currently flipping glow, so the cut reads as a burn rather than a fade.
  float edge = 1.0 - abs(mask * 2.0 - 1.0);
  outColor = vec4(base.rgb + u_edge * edge * 0.55 * base.a, base.a);
}`;

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

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
    // Without this the shader fails silently and the transition renders black.
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};

const uploadTexture = (
  gl: WebGL2RenderingContext,
  texture: WebGLTexture | null,
  image: OffscreenCanvas | null,
  unit: number,
) => {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  if (image) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image,
    );
  }
};

export const grainDissolveShader: HtmlInCanvasShader<GrainDissolveProps> = (
  canvas,
) => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true });
  if (!gl) {
    throw new Error("WebGL2 unavailable");
  }

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

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const prevTex = gl.createTexture();
  const nextTex = gl.createTexture();

  return {
    clear: () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    cleanup: () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteTexture(prevTex);
      gl.deleteTexture(nextTex);
      gl.deleteBuffer(buffer);
    },
    draw: ({ prevImage, nextImage, width, height, time, passedProps }) => {
      const {
        grain = 9,
        softness = 0.18,
        edgeColor = [1, 0.62, 0.24],
        sweep = 0.6,
      } = passedProps;

      gl.viewport(0, 0, width, height);
      gl.useProgram(program);

      uploadTexture(gl, prevTex, prevImage, 0);
      gl.uniform1i(gl.getUniformLocation(program, "u_prev"), 0);

      uploadTexture(gl, nextTex, nextImage, 1);
      gl.uniform1i(gl.getUniformLocation(program, "u_next"), 1);

      // At the edges of a series only one scene exists; pinning time keeps the
      // lone scene fully opaque instead of dissolving it against nothing.
      const t = !prevImage ? 0 : !nextImage ? 1 : time;
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), t);
      gl.uniform2f(
        gl.getUniformLocation(program, "u_resolution"),
        width,
        height,
      );
      gl.uniform1f(gl.getUniformLocation(program, "u_grain"), grain);
      gl.uniform1f(gl.getUniformLocation(program, "u_softness"), softness);
      gl.uniform1f(gl.getUniformLocation(program, "u_sweep"), sweep);
      gl.uniform3f(
        gl.getUniformLocation(program, "u_edge"),
        edgeColor[0],
        edgeColor[1],
        edgeColor[2],
      );

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
};

export const grainDissolve =
  makeHtmlInCanvasPresentation(grainDissolveShader);
