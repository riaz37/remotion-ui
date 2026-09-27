import { useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { FIELD_SHADER, SCREEN_SHADER, VERTEX_SHADER } from "../../../../components/landing/phosphor-field-shaders";
import type { Rect } from "../captures";

/**
 * PhosphorField: the homepage hero's light field, rendered from the site's
 * own source (apps/web/components/landing/phosphor-field.tsx and its shaders)
 * so the film's hero is the real page, not a still that missed it.
 *
 * Differences from the site component, all for frame-accurate rendering:
 * - `uTime` comes from the film frame instead of a requestAnimationFrame
 *   clock, so every render of a frame is identical.
 * - `uProgress` is 0: the hero at rest (scrollY 0), as captured.
 * - The canvas size and pixel ratio are the site's own numbers for a
 *   1920×1023 stage: its 1.8 MP budget caps the ratio at 0.9573 (the live
 *   canvas measured 1838×979), whatever the device pixel ratio.
 * - `preserveDrawingBuffer` keeps the frame on the canvas for the screenshot.
 * The mask is `.phosphor-mask` from apps/web/app/globals.css, copied verbatim.
 */

const PAGE_DARK = [0x06, 0x06, 0x05].map((v) => v / 255);
const PAGE_PAPER = [0xf7, 0xf5, 0xf1].map((v) => v / 255);
const MAX_PIXEL_RATIO = 1.5;
const MAX_PIXELS = 1_800_000;

const MASK = [
  "radial-gradient(ellipse 95% 80% at 50% 62%, #000 20%, transparent 88%)",
  "linear-gradient(to bottom, transparent 0%, #000 22%, #000 90%, transparent 100%)",
  "radial-gradient(ellipse 40% 36% at 50% 30%, transparent 48%, #000 100%)",
].join(", ");

type Gl = {
  gl: WebGL2RenderingContext;
  field: WebGLProgram;
  screen: WebGLProgram;
  framebuffer: WebGLFramebuffer | null;
  scene: WebGLTexture | null;
};

const link = (gl: WebGL2RenderingContext, fragment: string): WebGLProgram => {
  const program = gl.createProgram();
  if (!program) throw new Error("PhosphorField: could not create program");
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("PhosphorField: could not create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`PhosphorField: shader compile failed: ${gl.getShaderInfoLog(shader)}`);
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`PhosphorField: link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
};

const setup = (canvas: HTMLCanvasElement, w: number, h: number): Gl => {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    // Unlike the site, a blank field here is a wrong frame, not a fallback.
    throw new Error("PhosphorField: WebGL2 unavailable (render with --gl=angle)");
  }
  const field = link(gl, FIELD_SHADER);
  const screen = link(gl, SCREEN_SHADER);
  const framebuffer = gl.createFramebuffer();
  const scene = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, scene);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { gl, field, screen, framebuffer, scene };
};

const draw = ({ gl, field, screen, framebuffer, scene }: Gl, w: number, h: number, time: number, pixelRatio: number) => {
  const u = (program: WebGLProgram, name: string) => gl.getUniformLocation(program, name);
  gl.viewport(0, 0, w, h);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.useProgram(field);
  gl.uniform2f(u(field, "uResolution"), w, h);
  gl.uniform1f(u(field, "uTime"), time);
  gl.uniform1f(u(field, "uProgress"), 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(screen);
  gl.uniform2f(u(screen, "uResolution"), w, h);
  gl.uniform1f(u(screen, "uProgress"), 0);
  gl.uniform1f(u(screen, "uPixelRatio"), pixelRatio);
  gl.uniform1f(u(screen, "uTheme"), 0);
  gl.uniform3fv(u(screen, "uPageDark"), PAGE_DARK);
  gl.uniform3fv(u(screen, "uPagePaper"), PAGE_PAPER);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, scene);
  gl.uniform1i(u(screen, "uField"), 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.finish();
};

export const PhosphorField: React.FC<{ rect: Rect; time: number }> = ({ rect, time }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<Gl | null>(null);
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, Math.sqrt(MAX_PIXELS / (rect.w * rect.h)));
  const w = Math.max(1, Math.floor(rect.w * pixelRatio));
  const h = Math.max(1, Math.floor(rect.h * pixelRatio));
  const [handle] = useState(() => delayRender("Drawing the hero phosphor field"));

  // Drawn in a layout effect, before the frame is captured; the handle is
  // released once the first draw has landed, and every later frame draws
  // synchronously in the same effect.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      if (!glRef.current) {
        glRef.current = setup(canvas, w, h);
      }
      draw(glRef.current, w, h, time, pixelRatio);
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [time, w, h, pixelRatio, handle]);

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        maskImage: MASK,
        WebkitMaskImage: MASK,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} width={w} height={h} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};
