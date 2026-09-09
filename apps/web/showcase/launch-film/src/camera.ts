/**
 * camera.ts — one camera over the whole take.
 *
 * The stills and every overlay drawn on them live inside a single transformed
 * layer, so a zoom moves the screenshot, the cursor and the selection ring as
 * one image. Nothing is positioned twice.
 */

import { interpolate } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { CAMERA, CAMERA_MOVE } from "./timeline";
import { COMPOSITION, type Point } from "./screen";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const lerpPoint = (from: Point, to: Point, t: number): Point => ({
  x: interpolate(t, [0, 1], [from.x, to.x]),
  y: interpolate(t, [0, 1], [from.y, to.y]),
});

/**
 * The move eases in and out: a linear pan across a screenshot reads as a
 * mechanism, and this camera is meant to read as attention.
 */
const progress = (frame: number, start: number) =>
  interpolate(frame, [start, start + CAMERA_MOVE], [0, 1], {
    ...clamp,
    easing: EASING.editorial,
  });

export const useCameraTransform = (frame: number): string => {
  let index = 0;
  for (let i = 0; i < CAMERA.length; i += 1) {
    if (frame >= CAMERA[i].start) {
      index = i;
    }
  }

  const to = CAMERA[index];
  const from = CAMERA[Math.max(0, index - 1)];
  const t = index === 0 ? 1 : progress(frame, to.start);

  const focal = lerpPoint(from.focal, to.focal, t);
  const scale = interpolate(t, [0, 1], [from.scale, to.scale]);

  // Centre the focal point, then refuse to show anything past the edge of the
  // still — a pan that runs off the composer would expose bare background.
  const raw = {
    x: COMPOSITION.width / 2 - focal.x * scale,
    y: COMPOSITION.height / 2 - focal.y * scale,
  };
  const x = Math.min(0, Math.max(COMPOSITION.width * (1 - scale), raw.x));
  const y = Math.min(0, Math.max(COMPOSITION.height * (1 - scale), raw.y));

  return `translate(${x}px, ${y}px) scale(${scale})`;
};
