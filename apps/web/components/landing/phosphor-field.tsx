"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import {
  FIELD_SHADER,
  SCREEN_SHADER,
  VERTEX_SHADER,
} from "./phosphor-field-shaders";

/** sRGB of --bay-bg in each theme, so the canvas edge disappears into the page. */
const BACKGROUND = {
  dark: [0x06, 0x06, 0x05].map((v) => v / 255),
  light: [0xf7, 0xf5, 0xf1].map((v) => v / 255),
};

/** A background does not need retina: cap both the ratio and the pixel budget. */
const MAX_PIXEL_RATIO = 1.5;
const MAX_PIXELS = 1_800_000;

type PhosphorFieldProps = {
  /** Hero scroll progress, 0 at rest and 1 with the monitor fully open. */
  progress: MotionValue<number>;
  className?: string;
};

/**
 * Scroll-reactive light field behind the hero.
 *
 * Nothing here re-renders React: scroll progress and theme are read into refs
 * and the draw loop picks them up. The loop pauses when the canvas is off
 * screen or the tab is hidden, and under reduced motion it draws one still
 * frame per change instead of animating. Without WebGL2 the canvas stays blank
 * and the page background shows through, which is the intended fallback.
 */
export function PhosphorField({ progress, className }: PhosphorFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    let programs: ReturnType<typeof buildPrograms>;
    try {
      programs = buildPrograms(gl);
    } catch (error) {
      console.error("PhosphorField:", error);
      return;
    }
    const { field, screen, fieldUniform, screenUniform } = programs;

    const framebuffer = gl.createFramebuffer();
    const scene = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, scene);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const root = document.documentElement;
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lightMode = root.classList.contains("dark") ? 0 : 1;
    let pixelRatio = 1;
    let sceneSize = "";
    let visible = true;
    let frame = 0;
    let elapsed = 0;
    let previous: number | null = null;

    const fit = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return false;
      pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        MAX_PIXEL_RATIO,
        Math.sqrt(MAX_PIXELS / (width * height)),
      );
      const w = Math.max(1, Math.floor(width * pixelRatio));
      const h = Math.max(1, Math.floor(height * pixelRatio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (sceneSize !== `${w}x${h}`) {
        sceneSize = `${w}x${h}`;
        gl.bindTexture(gl.TEXTURE_2D, scene);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      return true;
    };

    const draw = () => {
      if (!fit()) return;
      const { width, height } = canvas;
      const p = clamp01(progress.get());
      gl.viewport(0, 0, width, height);

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.useProgram(field);
      gl.uniform2f(fieldUniform("uResolution"), width, height);
      gl.uniform1f(fieldUniform("uTime"), elapsed);
      gl.uniform1f(fieldUniform("uProgress"), p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(screen);
      gl.uniform2f(screenUniform("uResolution"), width, height);
      gl.uniform1f(screenUniform("uTime"), elapsed);
      gl.uniform1f(screenUniform("uProgress"), p);
      gl.uniform1f(screenUniform("uPixelRatio"), pixelRatio);
      gl.uniform1f(screenUniform("uLightMode"), lightMode);
      gl.uniform3fv(screenUniform("uDarkBackground"), BACKGROUND.dark);
      gl.uniform3fv(screenUniform("uLightBackground"), BACKGROUND.light);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.uniform1i(screenUniform("uScene"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const canAnimate = () => visible && !document.hidden && !stillness.matches;

    const tick = (now: number) => {
      frame = 0;
      if (!canAnimate()) {
        previous = null;
        return;
      }
      elapsed += previous === null ? 0 : Math.min((now - previous) / 1000, 0.1);
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };

    /** Animate when allowed, otherwise paint a single still frame. */
    const refresh = () => {
      if (canAnimate()) {
        if (!frame) frame = requestAnimationFrame(tick);
        return;
      }
      cancelAnimationFrame(frame);
      frame = 0;
      previous = null;
      if (visible && !document.hidden) draw();
    };

    const resize = new ResizeObserver(refresh);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      refresh();
    });
    const themeWatch = new MutationObserver(() => {
      lightMode = root.classList.contains("dark") ? 0 : 1;
      if (!canAnimate()) refresh();
    });
    // Animated frames already read progress; a still frame needs a nudge.
    const unsubscribe = progress.on("change", () => {
      if (!canAnimate()) refresh();
    });

    resize.observe(canvas);
    intersection.observe(canvas);
    themeWatch.observe(root, { attributes: true, attributeFilter: ["class"] });
    stillness.addEventListener("change", refresh);
    document.addEventListener("visibilitychange", refresh);
    refresh();

    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      resize.disconnect();
      intersection.disconnect();
      themeWatch.disconnect();
      stillness.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", refresh);
      gl.deleteProgram(field);
      gl.deleteProgram(screen);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(scene);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function buildPrograms(gl: WebGL2RenderingContext) {
  const field = link(gl, FIELD_SHADER);
  const screen = link(gl, SCREEN_SHADER);
  return {
    field,
    screen,
    fieldUniform: uniformLookup(gl, field),
    screenUniform: uniformLookup(gl, screen),
  };
}

function link(gl: WebGL2RenderingContext, fragmentSource: string) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("could not create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`shader compile failed: ${gl.getShaderInfoLog(shader)}`);
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function uniformLookup(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>();
  return (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name) ?? null;
  };
}
