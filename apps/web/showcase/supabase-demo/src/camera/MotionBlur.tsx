import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { HEIGHT, WIDTH } from "../timeline";
import { screenVelocity, type Camera } from "./rig";

/**
 * MotionBlur — directional blur from the camera's analytic velocity.
 *
 * `@remotion/motion-blur` renders the whole tree N times per frame; with seven
 * dense panels that multiplies render time by N. The camera here is a pure
 * function, so its on-screen velocity is known exactly: one anisotropic
 * Gaussian along the direction of travel (plus a little for zoom speed) gives
 * the smear a 180° shutter would, for the cost of a single filter pass — and
 * only on frames that are actually moving.
 */

/** Blur length ≈ half the per-frame displacement (180° shutter), as a Gaussian σ. */
const SHUTTER = 0.2;
/** Zoom speed → radial smear at the frame edges, approximated isotropically. */
const ZOOM_SMEAR = 90;
const MAX_SIGMA = 16;
const THRESHOLD = 0.7;
/**
 * Soft knee: slow drifts and settles stay sharp (text must read), only real
 * travel smears. σ below the knee is dropped, above it passes through.
 */
const KNEE = 2.2;
const knee = (sigma: number) => Math.min(MAX_SIGMA, Math.max(0, sigma - KNEE));

export const blurSigma = (
  cameraAt: (frame: number) => Camera,
  frame: number,
  cuts: readonly number[],
): { x: number; y: number } => {
  // A cut is infinitely fast; blurring across it would smear two shots together.
  if (cuts.some((c) => Math.abs(frame - c) <= 1)) {
    return { x: 0, y: 0 };
  }
  const v = screenVelocity(cameraAt, frame);
  const zoom = v.zoom * ZOOM_SMEAR;
  return {
    x: knee(Math.abs(v.x) * SHUTTER + zoom),
    y: knee(Math.abs(v.y) * SHUTTER + zoom),
  };
};

export const MotionBlur: React.FC<{ sigma: { x: number; y: number }; children: ReactNode }> = ({
  sigma,
  children,
}) => {
  const active = sigma.x > THRESHOLD || sigma.y > THRESHOLD;
  return (
    <AbsoluteFill style={{ filter: active ? "url(#camera-motion-blur)" : undefined }}>
      {active ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          {/* The region is the frame in user space: the default (the element's
              bounding box) spans the whole transformed world, and Chrome
              drops the filter's resolution to fit it — a soft, dim frame. */}
          <filter
            id="camera-motion-blur"
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={`${sigma.x.toFixed(2)} ${sigma.y.toFixed(2)}`} edgeMode="duplicate" />
          </filter>
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
