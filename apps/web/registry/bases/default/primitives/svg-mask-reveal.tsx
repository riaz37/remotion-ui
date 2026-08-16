import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { MORPH_SHAPES, type MorphShapeName } from "@/remotion/lib/path-morph";

export type SvgMaskRevealProps = {
  /** What the mask reveals. Anything renderable — media, a scene, a gradient. */
  children?: ReactNode;
  /**
   * The mask shape. A name from `MORPH_SHAPES`, or any `d` string authored on a
   * 0–100 box; it is scaled to cover the frame from the shape's own centre.
   */
  shape?: MorphShapeName | string;
  /** Where the shape sits, as a fraction of the frame. */
  origin?: { x: number; y: number };
  /** Frames to wait before the reveal starts. */
  delayInFrames?: number;
  /** Frames the reveal takes. */
  durationInFrames?: number;
  /** Degrees the shape turns as it opens. */
  rotation?: number;
  /** Springs the growth instead of easing it, for a reveal with some snap. */
  bouncy?: boolean;
  /** Hides rather than reveals: the shape shrinks back over the content. */
  invert?: boolean;
  /** Painted behind the masked content. Omit for transparency. */
  backgroundColor?: string;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * An arbitrary SVG shape used as a reveal mask over anything.
 *
 * The shape grows from `origin` until it covers the frame. The scale it has to
 * reach is computed from the distance to the furthest corner, not from the
 * frame's width — a shape opening from a corner has further to travel than one
 * opening from the middle, and a fixed multiplier either leaves a gap on one
 * side or overshoots hugely on the other.
 *
 * The mask is an SVG `<mask>` rather than a CSS `clip-path`, so the same shape
 * can carry soft edges and so a `d` string authored anywhere drops straight in.
 */
export const SvgMaskReveal: React.FC<SvgMaskRevealProps> = ({
  children,
  shape = "circle",
  origin = { x: 0.5, y: 0.5 },
  delayInFrames = 0,
  durationInFrames = 40,
  rotation = 0,
  bouncy = false,
  invert = false,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, id } = useVideoConfig();
  // Mask ids are document-global; two reveals on one frame would share one.
  const maskId = `svg-mask-reveal-${id}`;

  const d = shape in MORPH_SHAPES ? MORPH_SHAPES[shape as MorphShapeName] : shape;

  const eased = bouncy
    ? spring({
        frame: frame - delayInFrames,
        fps,
        durationInFrames,
        config: { damping: 14, stiffness: 140, mass: 0.8 },
      })
    : interpolate(frame, [delayInFrames, delayInFrames + durationInFrames], [0, 1], {
        easing: EASING.editorial,
        ...clamp,
      });

  const progress = invert ? 1 - eased : eased;

  const cx = origin.x * width;
  const cy = origin.y * height;
  // Furthest corner from the origin, so the shape is guaranteed to cover the
  // frame at progress 1 wherever it opens from.
  const reach = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(width - cx, cy),
    Math.hypot(cx, height - cy),
    Math.hypot(width - cx, height - cy),
  );
  // The presets are authored on a 0–100 box, so half a box is 50 units; the
  // scale that puts the shape's edge on the far corner is reach / 50.
  const scale = (progress * reach * 2) / 100;

  return (
    <AbsoluteFill style={{ background: backgroundColor }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x={0} y={0} width={width} height={height} fill="#000" />
            <g
              transform={`translate(${cx} ${cy}) rotate(${
                progress * rotation
              }) scale(${scale}) translate(-50 -50)`}
            >
              <path d={d} fill="#fff" />
            </g>
          </mask>
        </defs>
      </svg>

      <AbsoluteFill style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
