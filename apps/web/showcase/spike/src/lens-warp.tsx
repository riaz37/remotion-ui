import { createEffect } from "remotion";

export type LensWarpParams = {
  /** Distortion strength from `0` to `1`. Defaults to `0.06`. */
  readonly amount?: number;
};

const DEFAULT_AMOUNT = 0.06;

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
 * Same warp as `@remotion/effects`' barrelDistortion, with one change that
 * matters: that shader writes a transparent pixel whenever the warp samples
 * outside the texture, which draws a dark rounded border around the frame at
 * any visible amount. The strongest stretch this warp produces is `1 + amount`
 * (at a corner, where the squared term is 1), so dividing the warped
 * coordinate by that factor guarantees every sample lands inside the texture.
 * The cost is a uniform `amount` magnification, invisible at these values.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSource;
uniform float uAmount;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  vec2 warped = centered;
  warped.x *= 1.0 + uAmount * centered.y * centered.y;
  warped.y *= 1.0 + uAmount * centered.x * centered.x;

  warped /= 1.0 + uAmount;

  // Belt and braces: float error at the exact corners can still land a hair
  // outside, and CLAMP_TO_EDGE would smear rather than blacken anyway.
  vec2 srcUv = clamp(warped * 0.5 + 0.5, 0.0, 1.0);

  fragColor = texture(uSource, srcUv);
}
`;

const QUAD = new Float32Array([
  -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
]);

type LensWarpState = {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vbo: WebGLBuffer;
  readonly texture: WebGLTexture;
  readonly uSource: WebGLUniformLocation | null;
  readonly uAmount: WebGLUniformLocation | null;
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
    // Without this the shader fails silently and the effect renders black.
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};

const setup = (target: HTMLCanvasElement): LensWarpState => {
  const gl = target.getContext("webgl2", {
    premultipliedAlpha: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    throw new Error("WebGL2 unavailable for the lensWarp effect");
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
  if (!vao || !vbo) {
    throw new Error("Could not create vertex array or buffer");
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Could not create texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    gl,
    program,
    vao,
    vbo,
    texture,
    uSource: gl.getUniformLocation(program, "uSource"),
    uAmount: gl.getUniformLocation(program, "uAmount"),
  };
};

export const lensWarp = createEffect<LensWarpParams, LensWarpState>({
  type: "dev.remotionui.effects.lensWarp",
  label: "lensWarp()",
  documentationLink: null,
  backend: "webgl2",
  calculateKey: (params) => `lens-warp-${params.amount ?? DEFAULT_AMOUNT}`,
  setup,
  apply: ({ state, source, width, height, params, flipSourceY }) => {
    const { gl, program, vao, texture, uSource, uAmount } = state;

    gl.viewport(0, 0, width, height);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipSourceY);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    if (uSource) {
      gl.uniform1i(uSource, 0);
    }

    if (uAmount) {
      gl.uniform1f(uAmount, params.amount ?? DEFAULT_AMOUNT);
    }

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
  schema: {
    amount: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      default: DEFAULT_AMOUNT,
      description: "Amount",
      hiddenFromList: false,
    },
  },
  validateParams: (params) => {
    const amount = params.amount ?? DEFAULT_AMOUNT;
    if (!Number.isFinite(amount) || amount < 0 || amount > 1) {
      throw new TypeError(
        `"amount" must be a finite number between 0 and 1, but got ${JSON.stringify(params.amount)}`,
      );
    }
  },
});
