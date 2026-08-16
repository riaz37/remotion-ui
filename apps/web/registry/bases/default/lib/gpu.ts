import { createEffect } from "remotion";

/**
 * The WebGL2 plumbing every GPU primitive in the registry repeats: compile a
 * fullscreen-quad program, upload the incoming frame as a texture, draw, clean
 * up. Components supply a fragment shader and a function that sets their own
 * uniforms, and nothing else.
 *
 * Two conventions worth knowing before writing a shader against this:
 *
 * - `vUv` follows clip space, so `vUv.y = 0` is the **bottom** of the frame.
 *   Anything positioned from DOM percentages must flip it. Getting this wrong
 *   renders a mirrored image that usually still looks plausible.
 * - `uSource` is the frame the effect chain handed over — the `<Solid>` colour
 *   for the first effect, the previous effect's output after that. Sample it
 *   rather than painting over it, or you discard whatever ran before.
 */

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUv;
out vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/** Position and UV for a triangle strip covering the frame. */
const QUAD = new Float32Array([
  -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
]);

export type ShaderEffectState = {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vbo: WebGLBuffer;
  readonly texture: WebGLTexture;
};

export type ShaderEffectOptions<P> = {
  /** Unique across the registry — Remotion keys effect instances on it. */
  readonly type: string;
  readonly label: string;
  readonly fragmentShader: string;
  /**
   * Stable string for the params. Two effects with the same key are treated as
   * the same instance, so anything that changes per frame belongs in here.
   */
  readonly calculateKey: (params: P) => string;
  /**
   * Set the shader's own uniforms. `uSource` and `uResolution` are already
   * bound. Throw here for invalid params rather than letting a shader read
   * garbage.
   */
  readonly setUniforms: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    params: P,
  ) => void;
  readonly validateParams?: (params: P) => void;
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
    // Without this the shader fails silently and the component renders black,
    // with the render still exiting 0.
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};

/**
 * Builds a Remotion effect from a fragment shader. Pass the result to the
 * `effects` prop of `<Solid>`, `<Img>`, `<Video>` or `<HtmlInCanvas>`.
 *
 * Note that renders need `Config.setChromiumOpenGlRenderer("angle")` — without
 * it the frame comes out unshaded and the render still succeeds.
 */
export const makeShaderEffect = <P,>({
  type,
  label,
  fragmentShader,
  calculateKey,
  setUniforms,
  validateParams,
}: ShaderEffectOptions<P>) =>
  createEffect<P, ShaderEffectState>({
    type,
    label,
    documentationLink: null,
    backend: "webgl2",
    calculateKey,
    schema: {},
    validateParams: validateParams ?? (() => undefined),
    setup: (target) => {
      const gl = target.getContext("webgl2", {
        premultipliedAlpha: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      if (!gl) {
        throw new Error(`WebGL2 unavailable for the ${label} effect`);
      }

      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

      const program = gl.createProgram();
      if (!program) {
        throw new Error("Could not create program");
      }

      const vertex = compile(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
      const fragment = compile(gl, fragmentShader, gl.FRAGMENT_SHADER);
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
          `Program failed to link: ${gl.getProgramInfoLog(program)}`,
        );
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
      setUniforms(gl, program, params);

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
  });

/** `#rgb` or `#rrggbb` to 0..1 components. Unparseable input falls back to black. */
export const hexToRgb = (hex: string): [number, number, number] => {
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
