import { useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The plumbing every `@paper-design/shaders-react` wrapper in the shaders lane
 * repeats. Three things have to be true before a Paper shader is safe to render
 * frame by frame, and none of them are true by default.
 *
 * 1. **The clock.** A Paper mount runs its own `requestAnimationFrame` loop and
 *    advances its time by the delta between real frames. That is wall time, so
 *    the same composition frame would sample a different point of the animation
 *    on every run. Passing `speed={0}` makes the mount cancel the loop outright
 *    and stop advancing, and `frame` then sets the time directly. Paper counts
 *    in milliseconds from zero (`u_time = frame / 1000`), which is what
 *    `usePaperShader` returns.
 *
 * 2. **The first draw.** The React component initialises its WebGL mount in an
 *    async effect, and the mount creates its canvas at the browser default of
 *    300x150 — it only takes the real size when its ResizeObserver fires. A
 *    still captured before both have happened is blank or a stretched thumbnail,
 *    and the render still exits 0. The hold below keeps the frame open until the
 *    mount exists and has drawn once at its settled size.
 *
 * 3. **Every later draw.** Paper sets the frame from a `useEffect`, which React
 *    may flush after the browser has painted — one frame of lag that looks like
 *    correct output until two renders are compared. Setting it again from a
 *    layout effect here lands the draw before paint, every frame.
 */

/** The element Paper hangs its mount on, marked with its own attribute. */
type PaperShaderHost = Element & {
  paperShaderMount?: { setFrame: (frameInMilliseconds: number) => void };
};

const findHost = (container: HTMLElement | null): PaperShaderHost | null =>
  container?.querySelector<HTMLElement>("[data-paper-shader]") ?? null;

export type PaperShader = {
  /** Wrap the Paper component in a plain element carrying this ref. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Pass as `frame`, alongside `speed={0}`. Milliseconds, per Paper's clock. */
  time: number;
};

/**
 * @param speed Multiplies how far the field travels per second of composition
 * time. `1` matches Paper's own `speed={1}`.
 */
export const usePaperShader = (speed: number): PaperShader => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = (frame / fps) * 1000 * speed;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef(time);
  timeRef.current = time;

  const { delayRender, continueRender } = useDelayRender();
  // Claimed during render, not from an effect: a hold opened after the effects
  // have flushed can be too late to stop the capture it is meant to block.
  const [handle] = useState(() =>
    delayRender("Paper shader: waiting for the first sized draw"),
  );
  const released = useRef(false);

  useEffect(() => {
    let raf = 0;

    const release = () => {
      if (released.current) return;
      released.current = true;
      continueRender(handle);
    };

    const waitForMount = () => {
      const host = findHost(containerRef.current);
      if (!host?.paperShaderMount) {
        raf = requestAnimationFrame(waitForMount);
        return;
      }
      // One frame of grace for the ResizeObserver, which Chrome delivers before
      // the next paint, then draw this frame at the size that survived.
      raf = requestAnimationFrame(() => {
        host.paperShaderMount?.setFrame(timeRef.current);
        release();
      });
    };

    waitForMount();

    return () => {
      cancelAnimationFrame(raf);
      // Never leave the hold open — an unmount mid-wait would hang the render.
      release();
    };
  }, [continueRender, handle]);

  useLayoutEffect(() => {
    findHost(containerRef.current)?.paperShaderMount?.setFrame(time);
  }, [time]);

  return { containerRef, time };
};

/** Fills its parent, so a wrapper can hand the shader the whole frame. */
export const PAPER_SHADER_FILL: React.CSSProperties = {
  width: "100%",
  height: "100%",
};
