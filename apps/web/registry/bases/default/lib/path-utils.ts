import { evolvePath } from "@remotion/paths";

export function getPathDrawStyles(progress: number, path: string) {
  const evolution = evolvePath(progress, path);
  return {
    strokeDasharray: evolution.strokeDasharray,
    strokeDashoffset: evolution.strokeDashoffset,
  };
}

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}
